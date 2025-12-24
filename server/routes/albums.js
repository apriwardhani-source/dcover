const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

const formatAlbum = (album) => {
    const getUrl = (path, type) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `/uploads/${type}/${path}`;
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

// Get all albums
router.get('/', async (req, res) => {
    try {
        const [albums] = await db.query(`
      SELECT a.*, u.name as artist_name,
        (SELECT COUNT(*) FROM songs WHERE album_id = a.id) as song_count
      FROM albums a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);

        res.json(albums.map(formatAlbum));
    } catch (error) {
        console.error('Get albums error:', error);
        res.status(500).json({ error: 'Failed to get albums' });
    }
});

// Get user's albums
router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const [albums] = await db.query(`
      SELECT a.*, u.name as artist_name,
        (SELECT COUNT(*) FROM songs WHERE album_id = a.id) as song_count
      FROM albums a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `, [userId]);

        res.json(albums.map(formatAlbum));
    } catch (error) {
        console.error('Get user albums error:', error);
        res.status(500).json({ error: 'Failed to get albums' });
    }
});

// Get album by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [albums] = await db.query(`
      SELECT a.*, u.name as artist_name
      FROM albums a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `, [id]);

        if (albums.length === 0) {
            return res.status(404).json({ error: 'Album not found' });
        }

        res.json(formatAlbum(albums[0]));
    } catch (error) {
        console.error('Get album error:', error);
        res.status(500).json({ error: 'Failed to get album' });
    }
});

// Create album
router.post('/', authMiddleware, (req, res, next) => {
    req.uploadType = 'albums';
    next();
}, uploadImage.single('cover'), async (req, res) => {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Album title required' });
        }

        const coverImage = req.file ? req.file.filename : null;

        const [result] = await db.query(
            'INSERT INTO albums (title, cover_image, user_id, created_at) VALUES (?, ?, ?, NOW())',
            [title, coverImage, req.user.id]
        );

        res.status(201).json({
            albumId: result.insertId,
            title,
            coverImage: coverImage ? `/uploads/albums/${coverImage}` : null,
            artistName: req.user.name,
            userId: req.user.id
        });
    } catch (error) {
        console.error('Create album error:', error);
        res.status(500).json({ error: 'Failed to create album' });
    }
});

// Update album metadata
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const userId = req.user.id;

        // Check ownership
        const [albums] = await db.query('SELECT user_id FROM albums WHERE id = ?', [id]);
        if (albums.length === 0) return res.status(404).json({ error: 'Album not found' });
        if (albums[0].user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const updates = [];
        const values = [];

        if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
        if (data.coverImage !== undefined) { updates.push('cover_image = ?'); values.push(data.coverImage); }

        if (updates.length > 0) {
            values.push(id);
            await db.query(
                `UPDATE albums SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        res.json({ success: true, message: 'Album updated' });
    } catch (error) {
        console.error('Update album error:', error);
        res.status(500).json({ error: 'Failed to update album' });
    }
});

// Update album cover (File Upload)
router.patch('/:id/cover', authMiddleware, (req, res, next) => {
    req.uploadType = 'albums';
    next();
}, uploadImage.single('cover'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const [albums] = await db.query('SELECT user_id FROM albums WHERE id = ?', [id]);
        if (albums.length === 0) return res.status(404).json({ error: 'Album not found' });
        if (albums[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Cover image required' });
        }

        await db.query('UPDATE albums SET cover_image = ? WHERE id = ?', [req.file.filename, id]);
        res.json({ coverImage: `/uploads/albums/${req.file.filename}` });
    } catch (error) {
        console.error('Update album cover error:', error);
        res.status(500).json({ error: 'Failed to update cover' });
    }
});

// Delete album
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const [albums] = await db.query('SELECT user_id FROM albums WHERE id = ?', [id]);
        if (albums.length === 0) return res.status(404).json({ error: 'Album not found' });
        if (albums[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Check if album has songs
        const [songs] = await db.query('SELECT COUNT(*) as count FROM songs WHERE album_id = ?', [id]);
        if (songs[0].count > 0) {
            return res.status(400).json({ error: 'Cannot delete album with songs' });
        }

        await db.query('DELETE FROM albums WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete album error:', error);
        res.status(500).json({ error: 'Failed to delete album' });
    }
});

module.exports = router;
