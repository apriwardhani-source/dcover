const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, name, email, photo_url, role, suspended, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            photoURL: u.photo_url,
            role: u.role,
            suspended: u.suspended,
            createdAt: u.created_at
        })));
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Suspend/unsuspend user (admin only)
router.patch('/:id/suspend', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { suspended } = req.body;

        // Can't suspend yourself or other admins
        const [users] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (users[0].role === 'admin') {
            return res.status(403).json({ error: 'Cannot suspend admin' });
        }

        await db.query('UPDATE users SET suspended = ? WHERE id = ?', [suspended, id]);
        res.json({ success: true, suspended });
    } catch (error) {
        console.error('Suspend error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Promote/demote user role (admin only)
router.patch('/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Can't change your own role
        if (parseInt(id) === req.user.id) {
            return res.status(403).json({ error: 'Cannot change your own role' });
        }

        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ success: true, role });
    } catch (error) {
        console.error('Change role error:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
});

// Get user profile
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.query(
            'SELECT id, name, email, photo_url, role, created_at FROM users WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        // Get user's song count and total likes
        const [stats] = await db.query(
            'SELECT COUNT(*) as songCount, COALESCE(SUM(likes), 0) as totalLikes FROM songs WHERE user_id = ?',
            [id]
        );

        const [albumStats] = await db.query(
            'SELECT COUNT(*) as albumCount FROM albums WHERE user_id = ?',
            [id]
        );

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            photoURL: user.photo_url,
            role: user.role,
            createdAt: user.created_at,
            songCount: stats[0].songCount,
            albumCount: albumStats[0].albumCount,
            totalLikes: stats[0].totalLikes
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Update user profile
router.patch('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, bio } = req.body;
        const userId = req.user.id;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: 'Name is required' });
        }

        await db.query(
            'UPDATE users SET name = ?, bio = ? WHERE id = ?',
            [name.trim(), bio || null, userId]
        );

        res.json({
            success: true,
            name: name.trim(),
            bio: bio || null
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Update profile photo
router.patch('/profile/photo', authMiddleware, require('../middleware/upload').uploadImage.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Photo required' });
        }

        const photoUrl = `/uploads/covers/${req.file.filename}`;
        await db.query('UPDATE users SET photo_url = ? WHERE id = ?', [photoUrl, req.user.id]);

        res.json({ photoURL: photoUrl });
    } catch (error) {
        console.error('Update photo error:', error);
        res.status(500).json({ error: 'Failed to update photo' });
    }
});

module.exports = router;
