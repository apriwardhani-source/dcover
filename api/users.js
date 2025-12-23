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
            SELECT u.id, u.name, u.photo_url,
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

    // GET /users/:id
    if (req.method === 'GET' && path.match(/^\d+$/)) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const [users] = await pool.query('SELECT id, name, email, photo_url, role, created_at FROM users WHERE id = ?', [path]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        const u = users[0];
        const [stats] = await pool.query('SELECT COUNT(*) as songCount, COALESCE(SUM(likes), 0) as totalLikes FROM songs WHERE user_id = ?', [path]);
        const [albumStats] = await pool.query('SELECT COUNT(*) as albumCount FROM albums WHERE user_id = ?', [path]);
        return res.json({
            id: u.id, name: u.name, email: u.email, photoURL: u.photo_url, role: u.role, createdAt: u.created_at,
            songCount: stats[0].songCount, albumCount: albumStats[0].albumCount, totalLikes: stats[0].totalLikes
        });
    }

    return res.status(404).json({ error: 'Not found' });
};
