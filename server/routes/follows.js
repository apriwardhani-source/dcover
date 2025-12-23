const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// Follow a user
router.post('/:userId', authMiddleware, async (req, res) => {
    try {
        const followingId = parseInt(req.params.userId);

        if (followingId === req.user.id) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        await db.query(
            'INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)',
            [req.user.id, followingId]
        );

        res.json({ success: true, following: true });
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ error: 'Failed to follow user' });
    }
});

// Unfollow a user
router.delete('/:userId', authMiddleware, async (req, res) => {
    try {
        await db.query(
            'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
            [req.user.id, req.params.userId]
        );

        res.json({ success: true, following: false });
    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({ error: 'Failed to unfollow user' });
    }
});

// Check if following
router.get('/check/:userId', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [req.user.id, req.params.userId]
        );

        res.json({ following: rows.length > 0 });
    } catch (error) {
        console.error('Check follow error:', error);
        res.status(500).json({ error: 'Failed to check follow status' });
    }
});

// Get followers count
router.get('/followers/:userId', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM follows WHERE following_id = ?',
            [req.params.userId]
        );

        res.json({ count: rows[0].count });
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ error: 'Failed to get followers' });
    }
});

// Get following count
router.get('/following/:userId', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?',
            [req.params.userId]
        );

        res.json({ count: rows[0].count });
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ error: 'Failed to get following' });
    }
});

module.exports = router;
