const { cors, getAuthUser, getPool } = require('./lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = getPool();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/users', '').replace(/^\//, '');

    // GET /users/suggestions - Get users to follow (not already following)
    if (req.method === 'GET' && path === 'suggestions') {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Get users that current user is NOT following, excluding self
        const [users] = await pool.query(`
            SELECT u.id, u.name, u.username, u.photo_url,
                   (SELECT COUNT(*) FROM songs WHERE user_id = u.id) as song_count,
                   (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as follower_count
            FROM users u
            WHERE u.id != ? 
              AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
              AND u.suspended = 0
            ORDER BY song_count DESC, follower_count DESC
            LIMIT 10
        `, [user.id, user.id]);

        return res.json(users.map(u => ({
            id: u.id,
            name: u.name,
            username: u.username,
            photoURL: u.photo_url,
            songCount: u.song_count,
            followerCount: u.follower_count
        })));
    }

    // GET /users/search?q=query - Search all users
    if (req.method === 'GET' && path === 'search') {
        const query = url.searchParams.get('q');
        if (!query || query.trim().length < 2) {
            return res.json([]);
        }

        const searchTerm = `%${query.trim().toLowerCase()}%`;
        const [users] = await pool.query(`
            SELECT u.id, u.name, u.username, u.photo_url,
                   (SELECT COUNT(*) FROM songs WHERE user_id = u.id) as song_count,
                   (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as follower_count
            FROM users u
            WHERE u.suspended = 0
              AND (LOWER(u.name) LIKE ? OR LOWER(u.username) LIKE ?)
            ORDER BY song_count DESC, follower_count DESC
            LIMIT 20
        `, [searchTerm, searchTerm]);

        return res.json(users.map(u => ({
            id: u.id,
            name: u.name,
            username: u.username,
            photoURL: u.photo_url,
            songCount: u.song_count,
            followerCount: u.follower_count
        })));
    }

    // GET /users (admin)
    if (req.method === 'GET' && path === '') {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
        const [users] = await pool.query('SELECT id, name, email, photo_url, role, suspended, created_at FROM users ORDER BY created_at DESC');
        return res.json(users.map(u => ({
            id: u.id, name: u.name, email: u.email, photoURL: u.photo_url,
            role: u.role, suspended: u.suspended, createdAt: u.created_at
        })));
    }

    // PATCH /users/:id/suspend
    if (req.method === 'PATCH' && path.match(/^\d+\/suspend$/)) {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
        const id = path.split('/')[0];
        const { suspended } = req.body;
        const [users] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        if (users[0].role === 'admin') return res.status(403).json({ error: 'Cannot suspend admin' });
        await pool.query('UPDATE users SET suspended = ? WHERE id = ?', [suspended, id]);
        return res.json({ success: true, suspended });
    }

    // PATCH /users/:id/role
    if (req.method === 'PATCH' && path.match(/^\d+\/role$/)) {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
        const id = path.split('/')[0];
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
        if (parseInt(id) === user.id) return res.status(403).json({ error: 'Cannot change own role' });
        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        return res.json({ success: true, role });
    }

    // GET /users/by-username/:username - Get user by username
    if (req.method === 'GET' && path.startsWith('by-username/')) {
        const username = decodeURIComponent(path.replace('by-username/', '')).toLowerCase();
        const [users] = await pool.query('SELECT id, name, username, email, photo_url, bio, role, created_at FROM users WHERE LOWER(username) = ?', [username]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        const u = users[0];
        const [stats] = await pool.query('SELECT COUNT(*) as songCount, COALESCE(SUM(likes), 0) as totalLikes FROM songs WHERE user_id = ?', [u.id]);
        const [albumStats] = await pool.query('SELECT COUNT(*) as albumCount FROM albums WHERE user_id = ?', [u.id]);
        return res.json({
            id: u.id, name: u.name, username: u.username, email: u.email, photoURL: u.photo_url, bio: u.bio, role: u.role, createdAt: u.created_at,
            songCount: stats[0].songCount, albumCount: albumStats[0].albumCount, totalLikes: stats[0].totalLikes
        });
    }

    // GET /users/:id
    if (req.method === 'GET' && path.match(/^\d+$/)) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const [users] = await pool.query('SELECT id, name, username, email, photo_url, bio, role, created_at FROM users WHERE id = ?', [path]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        const u = users[0];
        const [stats] = await pool.query('SELECT COUNT(*) as songCount, COALESCE(SUM(likes), 0) as totalLikes FROM songs WHERE user_id = ?', [path]);
        const [albumStats] = await pool.query('SELECT COUNT(*) as albumCount FROM albums WHERE user_id = ?', [path]);
        return res.json({
            id: u.id, name: u.name, username: u.username, email: u.email, photoURL: u.photo_url, bio: u.bio, role: u.role, createdAt: u.created_at,
            songCount: stats[0].songCount, albumCount: albumStats[0].albumCount, totalLikes: stats[0].totalLikes
        });
    }

    // ============ NOTIFICATIONS ============

    // GET /users/notifications - Get user's notifications
    if (req.method === 'GET' && path === 'notifications') {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const [notifications] = await pool.query(`
                SELECT n.*, u.name as from_name, u.username as from_username, u.photo_url as from_photo
                FROM notifications n
                LEFT JOIN users u ON n.from_user_id = u.id
                WHERE n.user_id = ?
                ORDER BY n.created_at DESC
                LIMIT 50
            `, [user.id]);

            const [unreadCount] = await pool.query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
                [user.id]
            );

            return res.json({
                notifications: notifications.map(n => ({
                    id: n.id,
                    type: n.type,
                    message: n.message,
                    relatedId: n.related_id,
                    songId: n.song_id,
                    fromUser: n.from_user_id ? {
                        id: n.from_user_id,
                        name: n.from_name,
                        username: n.from_username,
                        photoURL: n.from_photo
                    } : null,
                    isRead: n.is_read === 1,
                    createdAt: n.created_at
                })),
                unreadCount: unreadCount[0].count
            });
        } catch (error) {
            console.error('Get notifications error:', error);
            return res.status(500).json({ error: 'Failed to get notifications' });
        }
    }

    // PATCH /users/notifications/read - Mark all as read
    if (req.method === 'PATCH' && path === 'notifications/read') {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        try {
            await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [user.id]);
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to mark as read' });
        }
    }

    // ============ MESSAGES ============

    // GET /users/messages - Get all conversations
    if (req.method === 'GET' && path === 'messages') {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const [conversations] = await pool.query(`
                SELECT 
                    c.id as conversation_id,
                    c.updated_at,
                    CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END as other_user_id,
                    u.name as other_user_name,
                    u.username as other_user_username,
                    u.photo_url as other_user_photo,
                    m.content as last_message,
                    m.sender_id as last_sender_id,
                    m.created_at as last_message_time,
                    (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
                FROM conversations c
                JOIN users u ON u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
                LEFT JOIN messages m ON m.id = (SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1)
                WHERE c.user1_id = ? OR c.user2_id = ?
                ORDER BY c.updated_at DESC
            `, [user.id, user.id, user.id, user.id, user.id]);

            return res.json(conversations.map(c => ({
                conversationId: c.conversation_id,
                otherUser: { id: c.other_user_id, name: c.other_user_name, username: c.other_user_username, photoURL: c.other_user_photo },
                lastMessage: c.last_message,
                lastSenderId: c.last_sender_id,
                lastMessageTime: c.last_message_time,
                unreadCount: c.unread_count,
                updatedAt: c.updated_at
            })));
        } catch (error) {
            console.error('Get conversations error:', error);
            return res.json([]);
        }
    }

    // GET /users/messages/:conversationId - Get messages
    if (req.method === 'GET' && path.startsWith('messages/') && !path.includes('user/')) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const conversationId = path.replace('messages/', '');

        try {
            const [conv] = await pool.query('SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)', [conversationId, user.id, user.id]);
            if (conv.length === 0) return res.status(403).json({ error: 'Access denied' });

            await pool.query('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?', [conversationId, user.id]);

            const [messages] = await pool.query(`
                SELECT m.*, u.name as sender_name, u.photo_url as sender_photo
                FROM messages m JOIN users u ON u.id = m.sender_id
                WHERE m.conversation_id = ? ORDER BY m.created_at ASC
            `, [conversationId]);

            return res.json(messages.map(m => ({
                id: m.id, content: m.content, senderId: m.sender_id, senderName: m.sender_name, senderPhoto: m.sender_photo, isRead: m.is_read === 1, createdAt: m.created_at
            })));
        } catch (error) {
            console.error('Get messages error:', error);
            return res.status(500).json({ error: 'Failed to get messages' });
        }
    }

    // POST /users/messages - Send a message
    if (req.method === 'POST' && path === 'messages') {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const { recipientId, content } = req.body;
        if (!recipientId || !content?.trim()) return res.status(400).json({ error: 'Recipient and content required' });

        try {
            let conversationId;
            const [existing] = await pool.query('SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)', [user.id, recipientId, recipientId, user.id]);

            if (existing.length > 0) {
                conversationId = existing[0].id;
            } else {
                const [newConv] = await pool.query('INSERT INTO conversations (user1_id, user2_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())', [user.id, recipientId]);
                conversationId = newConv.insertId;
            }

            const [result] = await pool.query('INSERT INTO messages (conversation_id, sender_id, content, is_read, created_at) VALUES (?, ?, ?, 0, NOW())', [conversationId, user.id, content.trim()]);
            await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = ?', [conversationId]);

            try {
                await pool.query('INSERT INTO notifications (user_id, from_user_id, type, message, created_at) VALUES (?, ?, ?, ?, NOW())', [recipientId, user.id, 'message', `${user.name} mengirim pesan`]);
            } catch (e) { }

            return res.status(201).json({ id: result.insertId, conversationId, content: content.trim(), senderId: user.id, createdAt: new Date().toISOString() });
        } catch (error) {
            console.error('Send message error:', error);
            return res.status(500).json({ error: 'Failed to send message' });
        }
    }

    // GET /users/messages/user/:userId - Get/create conversation with user
    if (req.method === 'GET' && path.startsWith('messages/user/')) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const otherUserIdStr = path.replace('messages/user/', '');
        const otherUserId = parseInt(otherUserIdStr);

        if (!otherUserId || isNaN(otherUserId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        if (otherUserId === user.id) {
            return res.status(400).json({ error: 'Cannot chat with yourself' });
        }

        try {
            const [existing] = await pool.query('SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)', [user.id, otherUserId, otherUserId, user.id]);

            if (existing.length > 0) return res.json({ conversationId: existing[0].id, isNew: false });

            const [newConv] = await pool.query('INSERT INTO conversations (user1_id, user2_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())', [user.id, otherUserId]);
            return res.json({ conversationId: newConv.insertId, isNew: true });
        } catch (error) {
            console.error('Get/create conversation error:', error);
            return res.status(500).json({ error: error.message || 'Failed to get conversation' });
        }
    }

    return res.status(404).json({ error: 'Not found' });
};
