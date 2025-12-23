const { cors, getAuthUser, getPool } = require('./lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = getPool();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/follows', '').replace(/^\//, '');

    // POST /follows/:userId (follow)
    if (req.method === 'POST' && path.match(/^\d+$/)) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const followingId = path;
        if (user.id == followingId) return res.status(400).json({ error: 'Cannot follow yourself' });
        const [existing] = await pool.query('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?', [user.id, followingId]);
        if (existing.length > 0) return res.status(400).json({ error: 'Already following' });
        await pool.query('INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, NOW())', [user.id, followingId]);
        return res.json({ success: true, following: true });
    }

    // DELETE /follows/:userId (unfollow)
    if (req.method === 'DELETE' && path.match(/^\d+$/)) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        await pool.query('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [user.id, path]);
        return res.json({ success: true, following: false });
    }

    // GET /follows/check/:userId
    if (req.method === 'GET' && path.startsWith('check/')) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const followingId = path.split('/')[1];
        const [existing] = await pool.query('SELECT * FROM follows WHERE follower_id = ? AND following_id = ?', [user.id, followingId]);
        return res.json({ following: existing.length > 0 });
    }

    // GET /follows/followers/:userId - Get list of followers with details
    if (req.method === 'GET' && path.startsWith('followers/')) {
        const userId = path.split('/')[1];
        const [followers] = await pool.query(`
            SELECT u.id, u.name, u.photo_url,
                   (SELECT COUNT(*) FROM songs WHERE user_id = u.id) as song_count
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
        `, [userId]);
        return res.json({
            count: followers.length,
            users: followers.map(u => ({
                id: u.id,
                name: u.name,
                photoURL: u.photo_url,
                songCount: u.song_count
            }))
        });
    }

    // GET /follows/following/:userId - Get list of following with details
    if (req.method === 'GET' && path.startsWith('following/')) {
        const userId = path.split('/')[1];
        const [following] = await pool.query(`
            SELECT u.id, u.name, u.photo_url,
                   (SELECT COUNT(*) FROM songs WHERE user_id = u.id) as song_count
            FROM follows f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
        `, [userId]);
        return res.json({
            count: following.length,
            users: following.map(u => ({
                id: u.id,
                name: u.name,
                photoURL: u.photo_url,
                songCount: u.song_count
            }))
        });
    }

    return res.status(404).json({ error: 'Not found' });
};
