const { cors, createToken, getAuthUser, ADMIN_EMAILS, getPool } = require('./lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = getPool();
    const path = req.url.replace('/api/auth', '').replace(/^\//, '');

    // POST /auth/google
    if (req.method === 'POST' && (path === 'google' || path === '')) {
        try {
            const { googleId, email, name, photoURL } = req.body;
            if (!googleId || !email || !name) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            let [users] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
            let user;

            if (users.length === 0) {
                const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'user';
                const [result] = await pool.query(
                    'INSERT INTO users (google_id, email, name, photo_url, role, suspended, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())',
                    [googleId, email, name, photoURL || null, role]
                );
                user = { id: result.insertId, google_id: googleId, email, name, photo_url: photoURL, role, suspended: 0 };
            } else {
                user = users[0];
                if (photoURL && photoURL !== user.photo_url) {
                    await pool.query('UPDATE users SET photo_url = ? WHERE id = ?', [photoURL, user.id]);
                    user.photo_url = photoURL;
                }
            }

            if (user.suspended) {
                return res.status(403).json({ error: 'Account suspended' });
            }

            const token = createToken({ userId: user.id, email: user.email });
            return res.json({
                token,
                user: { id: user.id, name: user.name, email: user.email, photoURL: user.photo_url, role: user.role }
            });
        } catch (error) {
            console.error('Auth error:', error);
            return res.status(500).json({ error: 'Authentication failed' });
        }
    }

    // GET /auth/me
    if (req.method === 'GET' && path === 'me') {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        return res.json({ id: user.id, name: user.name, email: user.email, photoURL: user.photo_url, role: user.role });
    }

    return res.status(404).json({ error: 'Not found' });
};
