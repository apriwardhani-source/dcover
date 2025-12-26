const { cors, getAuthUser, getPool } = require('./lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = getPool();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/comments', '').replace(/^\//, '');

    // GET /comments/song/:songId
    if (req.method === 'GET' && path.startsWith('song/')) {
        const songId = path.split('/')[1];
        const [comments] = await pool.query(`
            SELECT c.*, u.name as user_name, u.username as user_username, u.photo_url as user_photo
            FROM comments c LEFT JOIN users u ON c.user_id = u.id
            WHERE c.song_id = ? ORDER BY c.created_at DESC
        `, [songId]);
        return res.json(comments.map(c => ({
            id: c.id, content: c.content, songId: c.song_id, userId: c.user_id,
            userName: c.user_name, userUsername: c.user_username, userPhoto: c.user_photo, createdAt: c.created_at
        })));
    }

    // POST /comments
    if (req.method === 'POST' && path === '') {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const { songId, content } = req.body;
        if (!songId || !content?.trim()) return res.status(400).json({ error: 'Song ID and content required' });

        const [result] = await pool.query('INSERT INTO comments (song_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())', [songId, user.id, content.trim()]);

        // Create notification for song owner
        try {
            const [songs] = await pool.query('SELECT user_id, title FROM songs WHERE id = ?', [songId]);
            if (songs.length > 0 && songs[0].user_id !== user.id) {
                await pool.query(
                    'INSERT INTO notifications (user_id, from_user_id, type, song_id, message, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                    [songs[0].user_id, user.id, 'comment', songId, `${user.name} mengomentari lagu "${songs[0].title}"`]
                );
            }
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }

        return res.status(201).json({
            id: result.insertId, content: content.trim(), songId, userId: user.id,
            userName: user.name, userUsername: user.username, userPhoto: user.photo_url, createdAt: new Date().toISOString()
        });
    }

    // DELETE /comments/:id
    if (req.method === 'DELETE' && path.match(/^\d+$/)) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const [comments] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [path]);
        if (comments.length === 0) return res.status(404).json({ error: 'Comment not found' });
        if (comments[0].user_id !== user.id && user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        await pool.query('DELETE FROM comments WHERE id = ?', [path]);
        return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
};
