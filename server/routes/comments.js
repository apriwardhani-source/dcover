const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// Get comments for a song
router.get('/song/:songId', async (req, res) => {
    try {
        const [comments] = await db.query(
            `SELECT c.*, u.name as userName, u.photo_url as userPhoto
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.song_id = ?
             ORDER BY c.created_at DESC`,
            [req.params.songId]
        );
        res.json(comments);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to get comments' });
    }
});

// Add comment (authenticated)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { songId, content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment cannot be empty' });
        }

        const [result] = await db.query(
            'INSERT INTO comments (song_id, user_id, content) VALUES (?, ?, ?)',
            [songId, req.user.id, content.trim()]
        );

        const [user] = await db.query('SELECT name, photo_url FROM users WHERE id = ?', [req.user.id]);

        res.json({
            id: result.insertId,
            song_id: songId,
            user_id: req.user.id,
            content: content.trim(),
            userName: user[0].name,
            userPhoto: user[0].photo_url,
            created_at: new Date()
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Delete comment (owner or admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const [comments] = await db.query('SELECT user_id FROM comments WHERE id = ?', [req.params.id]);

        if (comments.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comments[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await db.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

module.exports = router;
