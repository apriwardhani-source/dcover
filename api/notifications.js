const { cors, getAuthUser, getPool } = require('./lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = getPool();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/notifications', '').replace(/^\//, '');

    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // GET /notifications - Get user's notifications
    if (req.method === 'GET' && path === '') {
        try {
            const [notifications] = await pool.query(`
                SELECT n.*, u.name as from_name, u.photo_url as from_photo
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
                    fromUser: n.from_user_id ? {
                        id: n.from_user_id,
                        name: n.from_name,
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

    // PATCH /notifications/read - Mark all as read
    if (req.method === 'PATCH' && path === 'read') {
        try {
            await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [user.id]);
            return res.json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to mark as read' });
        }
    }

    // PATCH /notifications/:id/read - Mark one as read
    if (req.method === 'PATCH' && path.match(/^\d+\/read$/)) {
        const notifId = path.split('/')[0];
        await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notifId, user.id]);
        return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
};
