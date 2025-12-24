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

                // Generate unique username from name
                const baseUsername = name.toLowerCase()
                    .replace(/[^a-z0-9]/g, '')
                    .substring(0, 20);
                let username = baseUsername;
                let counter = 1;

                while (true) {
                    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
                    if (existing.length === 0) break;
                    username = `${baseUsername}${counter}`;
                    counter++;
                }

                const [result] = await pool.query(
                    'INSERT INTO users (google_id, email, name, username, photo_url, role, suspended, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())',
                    [googleId, email, name, username, photoURL || null, role]
                );
                user = { id: result.insertId, google_id: googleId, email, name, username, photo_url: photoURL, role, suspended: 0 };
            } else {
                user = users[0];
                // Generate username for existing users who don't have one
                if (!user.username) {
                    const baseUsername = user.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
                    let username = baseUsername;
                    let counter = 1;
                    while (true) {
                        const [existing] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, user.id]);
                        if (existing.length === 0) break;
                        username = `${baseUsername}${counter}`;
                        counter++;
                    }
                    await pool.query('UPDATE users SET username = ? WHERE id = ?', [username, user.id]);
                    user.username = username;
                }
                // Only update photo if it's currently empty or it's still a Google default photo
                // This prevents manual uploads (Cloudinary) from being overwritten on every login
                const isGooglePhoto = (url) => url && (url.includes('googleusercontent.com') || url.includes('lh3.googleusercontent.com'));
                if (photoURL && (!user.photo_url || isGooglePhoto(user.photo_url))) {
                    if (photoURL !== user.photo_url) {
                        await pool.query('UPDATE users SET photo_url = ? WHERE id = ?', [photoURL, user.id]);
                        user.photo_url = photoURL;
                    }
                }
            }

            if (user.suspended) {
                return res.status(403).json({ error: 'Account suspended' });
            }

            const token = createToken({ userId: user.id, email: user.email });
            return res.json({
                token,
                user: { id: user.id, name: user.name, username: user.username, email: user.email, photoURL: user.photo_url, role: user.role }
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
        return res.json({ id: user.id, name: user.name, username: user.username, email: user.email, photoURL: user.photo_url, role: user.role });
    }

    return res.status(404).json({ error: 'Not found' });
};
