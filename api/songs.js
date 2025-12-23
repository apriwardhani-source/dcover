const { cors, getAuthUser, getPool } = require('./_lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = getPool();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/songs', '').replace(/^\//, '');

    // GET /songs - All songs
    if (req.method === 'GET' && path === '') {
        try {
            const [songs] = await pool.query(`
                SELECT s.*, u.name as cover_artist, a.cover_image as album_cover, a.title as album_title
                FROM songs s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN albums a ON s.album_id = a.id
                ORDER BY s.created_at DESC
            `);
            return res.json(songs.map(s => ({
                songId: s.id, title: s.title, originalArtist: s.original_artist, coverArtist: s.cover_artist,
                audioUrl: s.audio_file, albumId: s.album_id, albumTitle: s.album_title,
                albumCover: s.album_cover, coverImage: s.cover_image, likes: s.likes, lyrics: s.lyrics,
                userId: s.user_id, createdAt: s.created_at
            })));
        } catch (error) {
            return res.status(500).json({ error: 'Failed to get songs' });
        }
    }

    // GET /songs/liked/:userId
    if (req.method === 'GET' && path.startsWith('liked/')) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = path.split('/')[1];
        const [likes] = await pool.query('SELECT song_id FROM song_likes WHERE user_id = ?', [userId]);
        return res.json(likes.map(l => l.song_id));
    }

    // GET /songs/user/:userId
    if (req.method === 'GET' && path.startsWith('user/')) {
        const userId = path.split('/')[1];
        const [songs] = await pool.query(`
            SELECT s.*, u.name as cover_artist, a.cover_image as album_cover
            FROM songs s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN albums a ON s.album_id = a.id
            WHERE s.user_id = ? ORDER BY s.created_at DESC
        `, [userId]);
        return res.json(songs.map(s => ({
            songId: s.id, title: s.title, originalArtist: s.original_artist, coverArtist: s.cover_artist,
            audioUrl: s.audio_file, albumId: s.album_id, albumCover: s.album_cover,
            coverImage: s.cover_image, likes: s.likes, userId: s.user_id, createdAt: s.created_at
        })));
    }

    // GET /songs/album/:albumId
    if (req.method === 'GET' && path.startsWith('album/')) {
        const albumId = path.split('/')[1];
        const [songs] = await pool.query(`
            SELECT s.*, u.name as cover_artist, a.cover_image as album_cover
            FROM songs s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN albums a ON s.album_id = a.id
            WHERE s.album_id = ? ORDER BY s.created_at ASC
        `, [albumId]);
        return res.json(songs.map(s => ({
            songId: s.id, title: s.title, originalArtist: s.original_artist, coverArtist: s.cover_artist,
            audioUrl: s.audio_file, albumId: s.album_id, albumCover: s.album_cover,
            coverImage: s.cover_image, likes: s.likes, userId: s.user_id, createdAt: s.created_at
        })));
    }

    // POST /songs/:id/like
    if (req.method === 'POST' && path.match(/^\d+\/like$/)) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const songId = path.split('/')[0];
        const [existing] = await pool.query('SELECT * FROM song_likes WHERE song_id = ? AND user_id = ?', [songId, user.id]);
        if (existing.length > 0) {
            await pool.query('DELETE FROM song_likes WHERE song_id = ? AND user_id = ?', [songId, user.id]);
            await pool.query('UPDATE songs SET likes = likes - 1 WHERE id = ?', [songId]);
            return res.json({ liked: false });
        } else {
            await pool.query('INSERT INTO song_likes (song_id, user_id) VALUES (?, ?)', [songId, user.id]);
            await pool.query('UPDATE songs SET likes = likes + 1 WHERE id = ?', [songId]);
            return res.json({ liked: true });
        }
    }

    // DELETE /songs/:id
    if (req.method === 'DELETE' && path.match(/^\d+$/)) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });
        const id = path;
        const [songs] = await pool.query('SELECT user_id FROM songs WHERE id = ?', [id]);
        if (songs.length === 0) return res.status(404).json({ error: 'Song not found' });
        if (songs[0].user_id !== user.id && user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        await pool.query('DELETE FROM song_likes WHERE song_id = ?', [id]);
        await pool.query('DELETE FROM songs WHERE id = ?', [id]);
        return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
};
