const { cors, getAuthUser, getPool } = require('./lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = getPool();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/albums', '').replace(/^\//, '');

    // GET /albums
    if (req.method === 'GET' && path === '') {
        const [albums] = await pool.query(`
            SELECT a.*, u.name as artist_name, (SELECT COUNT(*) FROM songs WHERE album_id = a.id) as song_count
            FROM albums a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC
        `);
        return res.json(albums.map(a => ({
            albumId: a.id, title: a.title, coverImage: a.cover_image, artistName: a.artist_name,
            userId: a.user_id, songCount: a.song_count, createdAt: a.created_at
        })));
    }

    // GET /albums/user/:userId
    if (req.method === 'GET' && path.startsWith('user/')) {
        const userId = path.split('/')[1];
        const [albums] = await pool.query(`
            SELECT a.*, u.name as artist_name, (SELECT COUNT(*) FROM songs WHERE album_id = a.id) as song_count
            FROM albums a LEFT JOIN users u ON a.user_id = u.id WHERE a.user_id = ? ORDER BY a.created_at DESC
        `, [userId]);
        return res.json(albums.map(a => ({
            albumId: a.id, title: a.title, coverImage: a.cover_image, artistName: a.artist_name,
            userId: a.user_id, songCount: a.song_count, createdAt: a.created_at
        })));
    }

    // GET /albums/:id
    if (req.method === 'GET' && path.match(/^\d+$/)) {
        const [albums] = await pool.query(`
            SELECT a.*, u.name as artist_name FROM albums a LEFT JOIN users u ON a.user_id = u.id WHERE a.id = ?
        `, [path]);
        if (albums.length === 0) return res.status(404).json({ error: 'Album not found' });
        const a = albums[0];
        return res.json({
            albumId: a.id, title: a.title, coverImage: a.cover_image, artistName: a.artist_name,
            userId: a.user_id, createdAt: a.created_at
        });
    }

    // DELETE /albums/:id
    if (req.method === 'DELETE' && path.match(/^\d+$/)) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const [albums] = await pool.query('SELECT user_id FROM albums WHERE id = ?', [path]);
        if (albums.length === 0) return res.status(404).json({ error: 'Album not found' });
        if (albums[0].user_id !== user.id && user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const [songs] = await pool.query('SELECT COUNT(*) as count FROM songs WHERE album_id = ?', [path]);
        if (songs[0].count > 0) return res.status(400).json({ error: 'Cannot delete album with songs' });
        await pool.query('DELETE FROM albums WHERE id = ?', [path]);
        return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
};
