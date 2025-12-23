const { cors, getAuthUser, getPool } = require('./lib/auth');

// Cloudinary config
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dzz91k3ky';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '156762142886979';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'dhoI3ZDARt2wXE6EtuDyd0QyiT8';

async function uploadToCloudinary(base64Data, folder, resourceType = 'auto') {
    const crypto = require('crypto');
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto.createHash('sha1')
        .update(`folder=${folder}&timestamp=${timestamp}&upload_preset=ml_default${CLOUDINARY_API_SECRET}`)
        .digest('hex');

    const formData = new URLSearchParams();
    formData.append('file', base64Data);
    formData.append('folder', folder);
    formData.append('timestamp', timestamp);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('signature', signature);
    formData.append('upload_preset', 'ml_default');

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
        { method: 'POST', body: formData }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cloudinary upload failed: ${error}`);
    }

    return await response.json();
}

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const user = await getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const pool = getPool();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/upload', '').replace(/^\//, '');

    // POST /upload/song - Upload a song
    if (req.method === 'POST' && path === 'song') {
        try {
            const { title, originalArtist, audioData, coverData, albumId, lyrics } = req.body;

            if (!title || !originalArtist || !audioData) {
                return res.status(400).json({ error: 'Title, original artist, and audio are required' });
            }

            // Upload audio to Cloudinary
            const audioResult = await uploadToCloudinary(audioData, 'dcover/audio', 'video');
            const audioUrl = audioResult.secure_url;

            // Upload cover if provided
            let coverUrl = null;
            if (coverData) {
                const coverResult = await uploadToCloudinary(coverData, 'dcover/covers', 'image');
                coverUrl = coverResult.secure_url;
            }

            // Insert into database
            const [result] = await pool.query(
                `INSERT INTO songs (title, original_artist, audio_file, cover_image, album_id, user_id, lyrics, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [title, originalArtist, audioUrl, coverUrl, albumId || null, user.id, lyrics || null]
            );

            return res.status(201).json({
                songId: result.insertId,
                title,
                originalArtist,
                audioUrl,
                coverImage: coverUrl,
                albumId,
                userId: user.id
            });
        } catch (error) {
            console.error('Upload song error:', error);
            return res.status(500).json({ error: 'Failed to upload song: ' + error.message });
        }
    }

    // POST /upload/album - Create album with cover
    if (req.method === 'POST' && path === 'album') {
        try {
            const { title, coverData } = req.body;

            if (!title) {
                return res.status(400).json({ error: 'Title is required' });
            }

            // Upload cover if provided
            let coverUrl = null;
            if (coverData) {
                const coverResult = await uploadToCloudinary(coverData, 'dcover/albums', 'image');
                coverUrl = coverResult.secure_url;
            }

            const [result] = await pool.query(
                'INSERT INTO albums (title, cover_image, user_id, created_at) VALUES (?, ?, ?, NOW())',
                [title, coverUrl, user.id]
            );

            return res.status(201).json({
                albumId: result.insertId,
                title,
                coverImage: coverUrl,
                userId: user.id
            });
        } catch (error) {
            console.error('Upload album error:', error);
            return res.status(500).json({ error: 'Failed to create album: ' + error.message });
        }
    }

    // PATCH /upload/profile - Update profile
    if (req.method === 'PATCH' && path === 'profile') {
        try {
            const { name, bio, photoData } = req.body;

            // Upload photo if provided
            let photoUrl = user.photo_url;
            if (photoData) {
                const photoResult = await uploadToCloudinary(photoData, 'dcover/profiles', 'image');
                photoUrl = photoResult.secure_url;
            }

            await pool.query(
                'UPDATE users SET name = COALESCE(?, name), bio = ?, photo_url = ? WHERE id = ?',
                [name, bio || null, photoUrl, user.id]
            );

            return res.json({
                id: user.id,
                name: name || user.name,
                bio,
                photoURL: photoUrl
            });
        } catch (error) {
            console.error('Update profile error:', error);
            return res.status(500).json({ error: 'Failed to update profile: ' + error.message });
        }
    }

    // POST /upload/banner - Create banner (admin)
    if (req.method === 'POST' && path === 'banner') {
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin required' });
        }

        try {
            const { title, link, imageData } = req.body;

            if (!title || !imageData) {
                return res.status(400).json({ error: 'Title and image are required' });
            }

            const imageResult = await uploadToCloudinary(imageData, 'dcover/banners', 'image');
            const imageUrl = imageResult.secure_url;

            const [result] = await pool.query(
                'INSERT INTO banners (title, image_url, link_url, is_active, created_at) VALUES (?, ?, ?, 1, NOW())',
                [title, imageUrl, link || null]
            );

            return res.status(201).json({
                id: result.insertId,
                title,
                imageUrl,
                link,
                isActive: true
            });
        } catch (error) {
            console.error('Upload banner error:', error);
            return res.status(500).json({ error: 'Failed to create banner: ' + error.message });
        }
    }

    return res.status(404).json({ error: 'Not found' });
};
