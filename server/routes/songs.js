const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { uploadAudio, uploadImage } = require('../middleware/upload');

const formatSong = (song) => {
    const getUrl = (path, type) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `/uploads/${type}/${path}`;
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

// Get all songs
router.get('/', async (req, res) => {
    try {
        const [songs] = await db.query(`
      SELECT s.*, u.name as cover_artist, a.cover_image as album_cover, a.title as album_title
      FROM songs s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN albums a ON s.album_id = a.id
      WHERE (s.is_public = 1 OR s.is_public IS NULL)
      ORDER BY s.created_at DESC
    `);

        res.json(songs.map(formatSong));
    } catch (error) {
        console.error('Get songs error:', error);
        res.status(500).json({ error: 'Failed to get songs' });
    }
});

// Get user's songs
router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const [songs] = await db.query(`
      SELECT s.*, u.name as cover_artist, a.cover_image as album_cover
      FROM songs s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN albums a ON s.album_id = a.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `, [userId]);

        res.json(songs.map(formatSong));
    } catch (error) {
        console.error('Get user songs error:', error);
        res.status(500).json({ error: 'Failed to get songs' });
    }
});

// Get songs by album
router.get('/album/:albumId', async (req, res) => {
    try {
        const { albumId } = req.params;
        const [songs] = await db.query(`
      SELECT s.*, u.name as cover_artist, a.cover_image as album_cover
      FROM songs s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN albums a ON s.album_id = a.id
      WHERE s.album_id = ?
      ORDER BY s.created_at ASC
    `, [albumId]);

        res.json(songs.map(formatSong));
    } catch (error) {
        console.error('Get album songs error:', error);
        res.status(500).json({ error: 'Failed to get songs' });
    }
});

// Upload song
router.post('/', authMiddleware, uploadAudio.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Audio file required' });
        }

        const { title, originalArtist, albumId, lyrics } = req.body;

        if (!title || !originalArtist) {
            return res.status(400).json({ error: 'Title and original artist required' });
        }

        const [result] = await db.query(
            'INSERT INTO songs (title, original_artist, audio_file, album_id, user_id, likes, lyrics, created_at, is_public) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 1)',
            [title, originalArtist, req.file.filename, albumId || null, req.user.id, 0, lyrics || null]
        );

        res.status(201).json({
            songId: result.insertId,
            title,
            originalArtist,
            audioUrl: `/uploads/audio/${req.file.filename}`,
            albumId: albumId || null,
            userId: req.user.id
        });
    } catch (error) {
        console.error('Upload song error:', error);
        res.status(500).json({ error: 'Failed to upload song' });
    }
});

// Update song metadata (title, cover, lyrics, visibility)
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const userId = req.user.id;

        // Check ownership
        const [songs] = await db.query('SELECT user_id FROM songs WHERE id = ?', [id]);
        if (songs.length === 0) return res.status(404).json({ error: 'Song not found' });
        if (songs[0].user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const updates = [];
        const values = [];

        if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
        if (data.originalArtist !== undefined) { updates.push('original_artist = ?'); values.push(data.originalArtist); }
        if (data.coverImage !== undefined) { updates.push('cover_image = ?'); values.push(data.coverImage); }
        if (data.lyrics !== undefined) { updates.push('lyrics = ?'); values.push(data.lyrics); }
        if (data.isPublic !== undefined) { updates.push('is_public = ?'); values.push(data.isPublic ? 1 : 0); }
        if (data.albumId !== undefined) { updates.push('album_id = ?'); values.push(data.albumId); }

        if (updates.length > 0) {
            values.push(id);
            await db.query(
                `UPDATE songs SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        res.json({ success: true, message: 'Song updated', debug: { id, updates } });
    } catch (error) {
        console.error('Update song error:', error);
        res.status(500).json({ error: 'Failed to update song: ' + error.message });
    }
});

// Update song cover (File Upload)
router.patch('/:id/cover', authMiddleware, uploadImage.single('cover'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const [songs] = await db.query('SELECT user_id FROM songs WHERE id = ?', [id]);
        if (songs.length === 0) return res.status(404).json({ error: 'Song not found' });
        if (songs[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Cover image required' });
        }

        await db.query('UPDATE songs SET cover_image = ? WHERE id = ?', [req.file.filename, id]);
        res.json({ coverImage: `/uploads/covers/${req.file.filename}` });
    } catch (error) {
        console.error('Update cover error:', error);
        res.status(500).json({ error: 'Failed to update cover' });
    }
});

// Like/unlike song
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if already liked
        const [existing] = await db.query(
            'SELECT * FROM song_likes WHERE song_id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length > 0) {
            // Unlike
            await db.query('DELETE FROM song_likes WHERE song_id = ? AND user_id = ?', [id, userId]);
            await db.query('UPDATE songs SET likes = likes - 1 WHERE id = ?', [id]);
            res.json({ liked: false });
        } else {
            // Like
            await db.query('INSERT INTO song_likes (song_id, user_id) VALUES (?, ?)', [id, userId]);
            await db.query('UPDATE songs SET likes = likes + 1 WHERE id = ?', [id]);
            res.json({ liked: true });
        }
    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ error: 'Failed to update like' });
    }
});

// Get liked songs for user
router.get('/liked/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const [likes] = await db.query('SELECT song_id FROM song_likes WHERE user_id = ?', [userId]);
        res.json(likes.map(l => l.song_id));
    } catch (error) {
        console.error('Get likes error:', error);
        res.status(500).json({ error: 'Failed to get liked songs' });
    }
});

// Delete song
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const [songs] = await db.query('SELECT user_id FROM songs WHERE id = ?', [id]);
        if (songs.length === 0) return res.status(404).json({ error: 'Song not found' });
        if (songs[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await db.query('DELETE FROM song_likes WHERE song_id = ?', [id]);
        await db.query('DELETE FROM songs WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete song error:', error);
        res.status(500).json({ error: 'Failed to delete song' });
    }
});

module.exports = router;
