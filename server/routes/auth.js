const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Admin emails (hardcoded for simplicity)
const ADMIN_EMAILS = ['apriw2005@gmail.com'];

// Google OAuth Login
router.post('/google', async (req, res) => {
    try {
        const { googleId, email, name, photoURL } = req.body;

        if (!googleId || !email || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user exists
        let [users] = await db.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
        let user;

        if (users.length === 0) {
            // Create new user
            const role = ADMIN_EMAILS.includes(email) ? 'admin' : 'user';
            const [result] = await db.query(
                'INSERT INTO users (google_id, email, name, photo_url, role, suspended, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [googleId, email, name, photoURL || null, role, false]
            );

            user = {
                id: result.insertId,
                google_id: googleId,
                email,
                name,
                photo_url: photoURL,
                role,
                suspended: false
            };
        } else {
            user = users[0];

            // Update photo if changed
            // Only update photo if it's currently empty or it's still a Google default photo
            const isGooglePhoto = (url) => url && (url.includes('googleusercontent.com') || url.includes('lh3.googleusercontent.com'));
            if (photoURL && (!user.photo_url || isGooglePhoto(user.photo_url))) {
                if (photoURL !== user.photo_url) {
                    await db.query('UPDATE users SET photo_url = ? WHERE id = ?', [photoURL, user.id]);
                    user.photo_url = photoURL;
                }
            }
        }

        if (user.suspended) {
            return res.status(403).json({ error: 'Account suspended' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                photoURL: user.photo_url,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

// Get current user
router.get('/me', require('../middleware/auth').authMiddleware, (req, res) => {
    const { id, name, email, photo_url, role } = req.user;
    res.json({
        id,
        name,
        email,
        photoURL: photo_url,
        role
    });
});

module.exports = router;
