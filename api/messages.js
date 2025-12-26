const { cors, getAuthUser, getPool } = require('./lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = getPool();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/messages', '').replace(/^\//, '');

    // GET /messages - Get all conversations
    if (req.method === 'GET' && path === '') {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const [conversations] = await pool.query(`
                SELECT 
                    c.id as conversation_id,
                    c.updated_at,
                    CASE 
                        WHEN c.user1_id = ? THEN c.user2_id 
                        ELSE c.user1_id 
                    END as other_user_id,
                    u.name as other_user_name,
                    u.username as other_user_username,
                    u.photo_url as other_user_photo,
                    m.content as last_message,
                    m.sender_id as last_sender_id,
                    m.created_at as last_message_time,
                    (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
                FROM conversations c
                JOIN users u ON u.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
                LEFT JOIN messages m ON m.id = (
                    SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
                )
                WHERE c.user1_id = ? OR c.user2_id = ?
                ORDER BY c.updated_at DESC
            `, [user.id, user.id, user.id, user.id, user.id]);

            return res.json(conversations.map(c => ({
                conversationId: c.conversation_id,
                otherUser: {
                    id: c.other_user_id,
                    name: c.other_user_name,
                    username: c.other_user_username,
                    photoURL: c.other_user_photo
                },
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

    // GET /messages/:conversationId - Get messages in a conversation
    if (req.method === 'GET' && path.match(/^\d+$/)) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const conversationId = path;

        try {
            // Verify user is part of conversation
            const [conv] = await pool.query(
                'SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
                [conversationId, user.id, user.id]
            );
            if (conv.length === 0) return res.status(403).json({ error: 'Access denied' });

            // Mark messages as read
            await pool.query(
                'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?',
                [conversationId, user.id]
            );

            const [messages] = await pool.query(`
                SELECT m.*, u.name as sender_name, u.photo_url as sender_photo
                FROM messages m
                JOIN users u ON u.id = m.sender_id
                WHERE m.conversation_id = ?
                ORDER BY m.created_at ASC
            `, [conversationId]);

            return res.json(messages.map(m => ({
                id: m.id,
                content: m.content,
                senderId: m.sender_id,
                senderName: m.sender_name,
                senderPhoto: m.sender_photo,
                isRead: m.is_read === 1,
                createdAt: m.created_at
            })));
        } catch (error) {
            console.error('Get messages error:', error);
            return res.status(500).json({ error: 'Failed to get messages' });
        }
    }

    // POST /messages - Send a message (create conversation if needed)
    if (req.method === 'POST' && path === '') {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { recipientId, content } = req.body;
        if (!recipientId || !content?.trim()) {
            return res.status(400).json({ error: 'Recipient and content required' });
        }

        try {
            // Check if conversation exists
            let conversationId;
            const [existing] = await pool.query(
                'SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
                [user.id, recipientId, recipientId, user.id]
            );

            if (existing.length > 0) {
                conversationId = existing[0].id;
            } else {
                // Create new conversation
                const [newConv] = await pool.query(
                    'INSERT INTO conversations (user1_id, user2_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
                    [user.id, recipientId]
                );
                conversationId = newConv.insertId;
            }

            // Insert message
            const [result] = await pool.query(
                'INSERT INTO messages (conversation_id, sender_id, content, is_read, created_at) VALUES (?, ?, ?, 0, NOW())',
                [conversationId, user.id, content.trim()]
            );

            // Update conversation timestamp
            await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = ?', [conversationId]);

            // Create notification
            try {
                await pool.query(
                    'INSERT INTO notifications (user_id, from_user_id, type, message, created_at) VALUES (?, ?, ?, ?, NOW())',
                    [recipientId, user.id, 'message', `${user.name} mengirim pesan`]
                );
            } catch (e) { console.error('Message notification error:', e); }

            return res.status(201).json({
                id: result.insertId,
                conversationId,
                content: content.trim(),
                senderId: user.id,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Send message error:', error);
            return res.status(500).json({ error: 'Failed to send message' });
        }
    }

    // GET /messages/user/:userId - Get or create conversation with user
    if (req.method === 'GET' && path.startsWith('user/')) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const otherUserId = path.replace('user/', '');

        try {
            // Find existing conversation
            const [existing] = await pool.query(
                'SELECT id FROM conversations WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
                [user.id, otherUserId, otherUserId, user.id]
            );

            if (existing.length > 0) {
                return res.json({ conversationId: existing[0].id, isNew: false });
            }

            // Create new conversation
            const [newConv] = await pool.query(
                'INSERT INTO conversations (user1_id, user2_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
                [user.id, otherUserId]
            );

            return res.json({ conversationId: newConv.insertId, isNew: true });
        } catch (error) {
            console.error('Get/create conversation error:', error);
            return res.status(500).json({ error: 'Failed to get conversation' });
        }
    }

    return res.status(404).json({ error: 'Not found' });
};
