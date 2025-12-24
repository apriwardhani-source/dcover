const { cors, getAuthUser, getPool } = require('./lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = getPool();
    const url = new URL(req.url, `http://${req.headers.host}`);
    // Extract path after /api/songs
    const path = url.pathname.replace('/api/songs', '').replace(/^\//, '');

    const formatSong = (song) => {
        const getUrl = (p, type) => {
            if (!p) return null;
            if (p.startsWith('http')) return p;
            return `/uploads/${type}/${p}`;
        };

        return {
            songId: song.id,
            title: song.title,
            originalArtist: song.original_artist,
            coverArtist: song.cover_artist,
            audioUrl: getUrl(song.audio_file, 'audio'),
            albumId: song.album_id,
            albumTitle: song.album_title,
            albumCover: getUrl(song.album_cover, 'albums'),
            coverImage: getUrl(song.cover_image, 'covers'),
            likes: song.likes,
            lyrics: song.lyrics,
            userId: song.user_id,
            isPublic: !!song.is_public,
            createdAt: song.created_at
        };
    };

    try {
        // GET /api/songs/user/:userId
        if (req.method === 'GET' && path.startsWith('user/')) {
            const userId = path.replace('user/', '');
            const [songs] = await pool.query(`
                SELECT s.*, u.name as cover_artist, a.cover_image as album_cover
                FROM songs s
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN albums a ON s.album_id = a.id
                WHERE s.user_id = ?
                ORDER BY s.created_at DESC
            `, [userId]);
            return res.json(songs.map(formatSong));
        }

        // GET /api/songs/album/:albumId
        if (req.method === 'GET' && path.startsWith('album/')) {
            const albumId = path.replace('album/', '');
            const [songs] = await pool.query(`
                SELECT s.*, u.name as cover_artist, a.cover_image as album_cover
                FROM songs s
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN albums a ON s.album_id = a.id
                WHERE s.album_id = ?
                ORDER BY s.created_at ASC
            `, [albumId]);
            return res.json(songs.map(formatSong));
        }

        // GET /api/songs/liked/:userId
        if (req.method === 'GET' && path.startsWith('liked/')) {
            const userId = path.replace('liked/', '');
            const [likes] = await pool.query('SELECT song_id FROM song_likes WHERE user_id = ?', [userId]);
            return res.json(likes.map(l => l.song_id));
        }

        // GET /api/songs/:id
        if (req.method === 'GET' && path && !path.includes('/')) {
            const [songs] = await pool.query(`
                SELECT s.*, u.name as cover_artist, a.cover_image as album_cover, a.title as album_title
                FROM songs s
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN albums a ON s.album_id = a.id
                WHERE s.id = ?
            `, [path]);
            if (songs.length === 0) return res.status(404).json({ error: 'Song not found' });
            return res.json(formatSong(songs[0]));
        }

        // GET /api/songs - All public songs
        if (req.method === 'GET' && path === '') {
            const [songs] = await pool.query(`
                SELECT s.*, u.name as cover_artist, a.cover_image as album_cover, a.title as album_title
                FROM songs s
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN albums a ON s.album_id = a.id
                WHERE (s.is_public = 1 OR s.is_public IS NULL)
                ORDER BY s.created_at DESC
            `);
            return res.json(songs.map(formatSong));
        }

        // POST /api/songs - Create song (requires auth)
        if (req.method === 'POST') {
            const user = await getAuthUser(req);
            if (!user) return res.status(401).json({ error: 'Unauthorized' });
            const { title, originalArtist, audioFile, albumId, lyrics } = req.body;
            if (!title || !originalArtist || !audioFile) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const [result] = await pool.query(
                'INSERT INTO songs (title, original_artist, audio_file, album_id, user_id, likes, lyrics, created_at, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 1)',
                [title, originalArtist, audioFile, albumId || null, user.id, 0, lyrics || null]
            );
            return res.status(201).json({ success: true, songId: result.insertId });
        }

        // PATCH /api/songs/:id/visibility (Toggles visibility)
        if (req.method === 'PATCH' && path.endsWith('/visibility')) {
            const user = await getAuthUser(req);
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            const id = path.split('/')[0];
            const [songs] = await pool.query('SELECT user_id, is_public FROM songs WHERE id = ?', [id]);
            if (songs.length === 0) return res.status(404).json({ error: 'Song not found' });
            if (songs[0].user_id !== user.id && user.role !== 'admin') {
                return res.status(403).json({ error: 'Not authorized' });
            }

            const newVisibility = songs[0].is_public === 1 ? 0 : 1;
            await pool.query('UPDATE songs SET is_public = ? WHERE id = ?', [newVisibility, id]);
            return res.json({ success: true, isPublic: newVisibility === 1 });
        }

        // PATCH /api/songs/:id
        if (req.method === 'PATCH' && path && !path.includes('/')) {
            const user = await getAuthUser(req);
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            // Check ownership
            const [songs] = await pool.query('SELECT user_id FROM songs WHERE id = ?', [path]);
            if (songs.length === 0) return res.status(404).json({ error: 'Song not found' });
            if (songs[0].user_id !== user.id && user.role !== 'admin') {
                return res.status(403).json({ error: 'Not authorized' });
            }

            const data = req.body;
            const updates = [];
            const values = [];

            if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
            if (data.originalArtist !== undefined) { updates.push('original_artist = ?'); values.push(data.originalArtist); }
            if (data.coverImage !== undefined) { updates.push('cover_image = ?'); values.push(data.coverImage); }
            if (data.lyrics !== undefined) { updates.push('lyrics = ?'); values.push(data.lyrics); }
            if (data.isPublic !== undefined) { updates.push('is_public = ?'); values.push(data.isPublic ? 1 : 0); }
            if (data.albumId !== undefined) { updates.push('album_id = ?'); values.push(data.albumId); }

            if (updates.length > 0) {
                values.push(path);
                await pool.query(`UPDATE songs SET ${updates.join(', ')} WHERE id = ?`, values);
            }

            return res.json({ success: true, message: 'Song updated' });
        }

        // DELETE /api/songs/:id
        if (req.method === 'DELETE' && path && !path.includes('/')) {
            const user = await getAuthUser(req);
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            const [songs] = await pool.query('SELECT user_id FROM songs WHERE id = ?', [path]);
            if (songs.length === 0) return res.status(404).json({ error: 'Song not found' });
            if (songs[0].user_id !== user.id && user.role !== 'admin') {
                return res.status(403).json({ error: 'Not authorized' });
            }

            await pool.query('DELETE FROM song_likes WHERE song_id = ?', [path]);
            await pool.query('DELETE FROM songs WHERE id = ?', [path]);
            return res.json({ success: true });
        }

        return res.status(404).json({ error: 'Not found' });
    } catch (error) {
        console.error('Songs API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
