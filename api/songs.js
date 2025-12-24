const { cors, getAuthUser, getPool } = require('./lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = getPool();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/songs', '').replace(/^\//, '');

    // GET /songs - All songs (public only, or all if owner viewing own)
    if (req.method === 'GET' && path === '') {
        try {
            const user = await getAuthUser(req);
            const [songs] = await pool.query(`
                SELECT s.*, u.name as cover_artist, a.cover_image as album_cover, a.title as album_title
                FROM songs s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN albums a ON s.album_id = a.id
                WHERE s.is_public = 1 OR s.is_public IS NULL
                ORDER BY s.created_at DESC
            `);
            return res.json(songs.map(s => ({
                songId: s.id, title: s.title, originalArtist: s.original_artist, coverArtist: s.cover_artist,
                audioUrl: s.audio_file, albumId: s.album_id, albumTitle: s.album_title,
                albumCover: s.album_cover, coverImage: s.cover_image, likes: s.likes, plays: s.plays || 0, lyrics: s.lyrics,
                userId: s.user_id, createdAt: s.created_at, isPublic: s.is_public !== 0
            })));
        } catch (error) {
            return res.status(500).json({ error: 'Failed to get songs' });
        }
    }

    // POST /songs - Create song (URL already uploaded to Cloudinary)
    if (req.method === 'POST' && path === '') {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        try {
            const { title, originalArtist, audioUrl, coverImage, albumId, lyrics } = req.body;

            if (!title || !originalArtist || !audioUrl) {
                return res.status(400).json({ error: 'Title, original artist, and audio URL are required' });
            }

            const [result] = await pool.query(
                `INSERT INTO songs (title, original_artist, audio_file, cover_image, album_id, user_id, lyrics, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [title, originalArtist, audioUrl, coverImage || null, albumId || null, user.id, lyrics || null]
            );

            return res.status(201).json({
                songId: result.insertId,
                title,
                originalArtist,
                audioUrl,
                coverImage,
                albumId,
                userId: user.id
            });
        } catch (error) {
            console.error('Create song error:', error);
            return res.status(500).json({ error: 'Failed to create song' });
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

    // GET /songs/user/:userId - Show all for owner, public only for others
    if (req.method === 'GET' && path.startsWith('user/')) {
        const userId = path.split('/')[1];
        const currentUser = await getAuthUser(req);
        const isOwner = currentUser && currentUser.id == userId;

        const whereClause = isOwner
            ? 'WHERE s.user_id = ?'
            : 'WHERE s.user_id = ? AND (s.is_public = 1 OR s.is_public IS NULL)';

        const [songs] = await pool.query(`
            SELECT s.*, u.name as cover_artist, a.cover_image as album_cover
            FROM songs s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN albums a ON s.album_id = a.id
            ${whereClause} ORDER BY s.created_at DESC
        `, [userId]);
        return res.json(songs.map(s => ({
            songId: s.id, title: s.title, originalArtist: s.original_artist, coverArtist: s.cover_artist,
            audioUrl: s.audio_file, albumId: s.album_id, albumCover: s.album_cover,
            coverImage: s.cover_image, likes: s.likes, plays: s.plays || 0, userId: s.user_id,
            createdAt: s.created_at, isPublic: s.is_public !== 0
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

    // PATCH /songs/:id - Edit song (owner only)
    if (req.method === 'PATCH' && path.match(/^\d+$/)) {
        const user = await getAuthUser(req);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const songId = path;
        const [songs] = await pool.query('SELECT user_id FROM songs WHERE id = ?', [songId]);
        if (songs.length === 0) return res.status(404).json({ error: 'Song not found' });
        if (songs[0].user_id !== user.id && user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { title, originalArtist, lyrics, isPublic } = req.body;
        const updates = [];
        const values = [];

        if (title) { updates.push('title = ?'); values.push(title); }
        if (originalArtist) { updates.push('original_artist = ?'); values.push(originalArtist); }
        if (lyrics !== undefined) { updates.push('lyrics = ?'); values.push(lyrics || null); }
        if (isPublic !== undefined) { updates.push('is_public = ?'); values.push(isPublic ? 1 : 0); }

        if (updates.length > 0) {
            values.push(songId);
            await pool.query(`UPDATE songs SET ${updates.join(', ')} WHERE id = ?`, values);
        }

        return res.json({ success: true });
    }

    // PATCH /songs/:id/visibility - Toggle public/private
    if (req.method === 'PATCH' && path.match(/^\d+\/visibility$/)) {
        try {
            const user = await getAuthUser(req);
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            const songId = path.split('/')[0];
            const [songs] = await pool.query('SELECT user_id, is_public FROM songs WHERE id = ?', [songId]);
            if (songs.length === 0) return res.status(404).json({ error: 'Song not found' });
            if (songs[0].user_id !== user.id) return res.status(403).json({ error: 'Not authorized' });

            // Handle null/undefined is_public (default to public)
            const currentValue = songs[0].is_public === 0 ? 0 : 1;
            const newValue = currentValue === 0 ? 1 : 0;
            await pool.query('UPDATE songs SET is_public = ? WHERE id = ?', [newValue, songId]);
            return res.json({ isPublic: newValue === 1 });
        } catch (error) {
            console.error('Toggle visibility error:', error);
            return res.status(500).json({ error: 'Failed to toggle visibility: ' + error.message });
        }
    }

    // POST /songs/:id/play - Increment play count
    if (req.method === 'POST' && path.match(/^\d+\/play$/)) {
        const songId = path.split('/')[0];
        await pool.query('UPDATE songs SET plays = COALESCE(plays, 0) + 1 WHERE id = ?', [songId]);
        const [result] = await pool.query('SELECT plays FROM songs WHERE id = ?', [songId]);
        return res.json({ plays: result[0]?.plays || 0 });
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
