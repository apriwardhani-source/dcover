const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

// Get all banners (public - only active ones)
router.get('/', async (req, res) => {
    try {
        const [banners] = await db.query(
            `SELECT * FROM banners 
             WHERE is_active = TRUE 
             AND (start_date IS NULL OR start_date <= NOW())
             AND (end_date IS NULL OR end_date >= NOW())
             ORDER BY created_at DESC`
        );
        res.json(banners);
    } catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({ error: 'Failed to get banners' });
    }
});

// Get all banners (admin - including inactive)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [banners] = await db.query(
            `SELECT b.*, u.name as created_by_name 
             FROM banners b 
             LEFT JOIN users u ON b.created_by = u.id 
             ORDER BY b.created_at DESC`
        );
        res.json(banners);
    } catch (error) {
        console.error('Get all banners error:', error);
        res.status(500).json({ error: 'Failed to get banners' });
    }
});

// Create banner (admin only)
router.post('/', authMiddleware, adminMiddleware, uploadImage.single('image'), async (req, res) => {
    try {
        const { title, description, link_url, start_date, end_date, is_active } = req.body;
        const imageUrl = req.file ? `/uploads/covers/${req.file.filename}` : null;

        const [result] = await db.query(
            `INSERT INTO banners (title, description, image_url, link_url, start_date, end_date, is_active, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description || null, imageUrl, link_url || null, start_date || null, end_date || null, is_active !== 'false', req.user.id]
        );

        res.json({ id: result.insertId, title, image_url: imageUrl });
    } catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({ error: 'Failed to create banner' });
    }
});

// Update banner (admin only)
router.patch('/:id', authMiddleware, adminMiddleware, uploadImage.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, link_url, start_date, end_date, is_active } = req.body;

        let query = 'UPDATE banners SET title = ?, description = ?, link_url = ?, start_date = ?, end_date = ?, is_active = ?';
        let params = [title, description || null, link_url || null, start_date || null, end_date || null, is_active !== 'false'];

        if (req.file) {
            query += ', image_url = ?';
            params.push(`/uploads/covers/${req.file.filename}`);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await db.query(query, params);
        res.json({ success: true });
    } catch (error) {
        console.error('Update banner error:', error);
        res.status(500).json({ error: 'Failed to update banner' });
    }
});

// Delete banner (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await db.query('DELETE FROM banners WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({ error: 'Failed to delete banner' });
    }
});

// Toggle banner active status (admin only)
router.patch('/:id/toggle', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await db.query('UPDATE banners SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Toggle banner error:', error);
        res.status(500).json({ error: 'Failed to toggle banner' });
    }
});

module.exports = router;
