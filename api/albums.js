const { cors, getAuthUser, getPool } = require('./lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = getPool();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/albums', '').replace(/^\//, '');

    const formatAlbum = (album) => {
        const getUrl = (p, type) => {
            if (!p) return null;
            if (p.startsWith('http')) return p;
            return `/uploads/${type}/${p}`;
        };

        return {
            albumId: album.id,
            title: album.title,
            coverImage: getUrl(album.cover_image, 'albums'),
            artistName: album.artist_name,
            userId: album.user_id,
            songCount: album.song_count || 0,
            createdAt: album.created_at
        };
    };

    try {
        // GET /api/albums/user/:userId
        if (req.method === 'GET' && path.startsWith('user/')) {
            const userId = path.replace('user/', '');
            const [albums] = await pool.query(`
                SELECT a.*, u.name as artist_name,
                  (SELECT COUNT(*) FROM songs WHERE album_id = a.id) as song_count
                FROM albums a
                LEFT JOIN users u ON a.user_id = u.id
                WHERE a.user_id = ?
                ORDER BY a.created_at DESC
            `, [userId]);
            return res.json(albums.map(formatAlbum));
        }

        // GET /api/albums/:id
        if (req.method === 'GET' && path && !path.includes('/')) {
            const [albums] = await pool.query(`
                SELECT a.*, u.name as artist_name
                FROM albums a
                LEFT JOIN users u ON a.user_id = u.id
                WHERE a.id = ?
            `, [path]);
            if (albums.length === 0) return res.status(404).json({ error: 'Album not found' });
            return res.json(formatAlbum(albums[0]));
        }

        // GET /api/albums - All albums
        if (req.method === 'GET' && path === '') {
            const [albums] = await pool.query(`
                SELECT a.*, u.name as artist_name,
                  (SELECT COUNT(*) FROM songs WHERE album_id = a.id) as song_count
                FROM albums a
                LEFT JOIN users u ON a.user_id = u.id
                ORDER BY a.created_at DESC
            `);
            return res.json(albums.map(formatAlbum));
        }

        // POST /api/albums
        if (req.method === 'POST') {
            const user = await getAuthUser(req);
            if (!user) return res.status(401).json({ error: 'Unauthorized' });
            const { title, coverImage } = req.body;
            if (!title) return res.status(400).json({ error: 'Title required' });
            const [result] = await pool.query(
                'INSERT INTO albums (title, cover_image, user_id, created_at) VALUES (?, ?, ?, NOW())',
                [title, coverImage || null, user.id]
            );
            return res.status(201).json({ success: true, albumId: result.insertId });
        }

        // PATCH /api/albums/:id
        if (req.method === 'PATCH' && path && !path.includes('/')) {
            const user = await getAuthUser(req);
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            const [albums] = await pool.query('SELECT user_id FROM albums WHERE id = ?', [path]);
            if (albums.length === 0) return res.status(404).json({ error: 'Album not found' });
            if (albums[0].user_id !== user.id && user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });

            const { title, coverImage } = req.body;
            const updates = [];
            const values = [];

            if (title !== undefined) { updates.push('title = ?'); values.push(title); }
            if (coverImage !== undefined) { updates.push('cover_image = ?'); values.push(coverImage); }

            if (updates.length > 0) {
                values.push(path);
                await pool.query(`UPDATE albums SET ${updates.join(', ')} WHERE id = ?`, values);
            }
            return res.json({ success: true, message: 'Album updated' });
        }

        return res.status(404).json({ error: 'Not found' });
    } catch (error) {
        console.error('Albums API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
