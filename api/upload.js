const { cors, getAuthUser, getPool } = require('./lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = getPool();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/upload', '').replace(/^\//, '');

    try {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // PATCH /api/upload/profile
        if (req.method === 'PATCH' && path === 'profile') {
            const { name, bio, photoURL } = req.body;
            if (!name) return res.status(400).json({ error: 'Name required' });

            const updates = ['name = ?', 'bio = ?'];
            const values = [name, bio || null];

            if (photoURL !== undefined) {
                updates.push('photo_url = ?');
                values.push(photoURL);
            }

            values.push(user.id);
            await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

            return res.json({ success: true, name, bio, photoURL });
        }

        // POST /api/upload/song (if needed for non-multipart uploads)
        // Note: Actual file uploads are handled by direct Cloudinary upload from frontend,
        // then metadata is sent here or to /api/songs.

        return res.status(404).json({ error: 'Not found' });
    } catch (error) {
        console.error('Upload API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
