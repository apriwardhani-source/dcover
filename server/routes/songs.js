const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { uploadAudio, uploadImage } = require('../middleware/upload');

// Get all songs
router.get('/', async (req, res) => {
    try {
        const [songs] = await db.query(`
      SELECT s.*, u.name as cover_artist, a.cover_image as album_cover, a.title as album_title
      FROM songs s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN albums a ON s.album_id = a.id
      ORDER BY s.created_at DESC
    `);

        res.json(songs.map(song => ({
            songId: song.id,
            title: song.title,
            originalArtist: song.original_artist,
            coverArtist: song.cover_artist,
            audioUrl: `/uploads/audio/${song.audio_file}`,
            albumId: song.album_id,
            albumTitle: song.album_title,
            albumCover: song.album_cover ? `/uploads/albums/${song.album_cover}` : null,
            coverImage: song.cover_image ? `/uploads/covers/${song.cover_image}` : null,
            likes: song.likes,
            lyrics: song.lyrics,
            userId: song.user_id,
            createdAt: song.created_at
        })));
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

        res.json(songs.map(song => ({
            songId: song.id,
            title: song.title,
            originalArtist: song.original_artist,
            coverArtist: song.cover_artist,
            audioUrl: `/uploads/audio/${song.audio_file}`,
            albumId: song.album_id,
            albumCover: song.album_cover ? `/uploads/albums/${song.album_cover}` : null,
            coverImage: song.cover_image ? `/uploads/covers/${song.cover_image}` : null,
            likes: song.likes,
            userId: song.user_id,
            createdAt: song.created_at
        })));
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

        res.json(songs.map(song => ({
            songId: song.id,
            title: song.title,
            originalArtist: song.original_artist,
            coverArtist: song.cover_artist,
            audioUrl: `/uploads/audio/${song.audio_file}`,
            albumId: song.album_id,
            albumCover: song.album_cover ? `/uploads/albums/${song.album_cover}` : null,
            coverImage: song.cover_image ? `/uploads/covers/${song.cover_image}` : null,
            likes: song.likes,
            userId: song.user_id,
            createdAt: song.created_at
        })));
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
            'INSERT INTO songs (title, original_artist, audio_file, album_id, user_id, likes, lyrics, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
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

// Update song cover
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
