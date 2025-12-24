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
            const data = req.body;
            const updates = [];
            const values = [];

            if (data.name !== undefined) {
                if (data.name.trim().length === 0) return res.status(400).json({ error: 'Name cannot be empty' });
                updates.push('name = ?');
                values.push(data.name.trim());
            }
            if (data.bio !== undefined) {
                updates.push('bio = ?');
                values.push(data.bio || null);
            }
            if (data.photoURL !== undefined) {
                updates.push('photo_url = ?');
                values.push(data.photoURL);
            }

            if (updates.length > 0) {
                values.push(user.id);
                await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
            }

            return res.json({ success: true, ...data });
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
