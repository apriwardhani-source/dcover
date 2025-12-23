const { cors, getAuthUser, getPool } = require('./lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const pool = getPool();
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/banners', '').replace(/^\//, '');

    // GET /banners (active only)
    if (req.method === 'GET' && path === '') {
        const [banners] = await pool.query('SELECT * FROM banners WHERE is_active = 1 ORDER BY created_at DESC');
        return res.json(banners.map(b => ({
            id: b.id, title: b.title, imageUrl: b.image_url, link: b.link_url, isActive: b.is_active, createdAt: b.created_at
        })));
    }

    // GET /banners/all (admin)
    if (req.method === 'GET' && path === 'all') {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
        const [banners] = await pool.query('SELECT * FROM banners ORDER BY created_at DESC');
        return res.json(banners.map(b => ({
            id: b.id, title: b.title, imageUrl: b.image_url, link: b.link_url, isActive: b.is_active, createdAt: b.created_at
        })));
    }

    // PATCH /banners/:id/toggle
    if (req.method === 'PATCH' && path.match(/^\d+\/toggle$/)) {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
        const id = path.split('/')[0];
        await pool.query('UPDATE banners SET is_active = NOT is_active WHERE id = ?', [id]);
        const [result] = await pool.query('SELECT is_active FROM banners WHERE id = ?', [id]);
        return res.json({ isActive: result[0]?.is_active });
    }

    // DELETE /banners/:id
    if (req.method === 'DELETE' && path.match(/^\d+$/)) {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
        await pool.query('DELETE FROM banners WHERE id = ?', [path]);
        return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
};
