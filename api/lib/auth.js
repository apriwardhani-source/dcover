const jwt = require('jsonwebtoken');
const { getPool } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dcover-jwt-secret-2024';
const ADMIN_EMAILS = ['apriw2005@gmail.com'];

function createToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

async function getAuthUser(req) {
    const auth = req.headers.authorization || '';
    const match = auth.match(/Bearer\s+(.+)/);
    if (!match) return null;

    const payload = verifyToken(match[1]);
    if (!payload) return null;

    const pool = getPool();
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [payload.userId]);
    return users[0] || null;
}

function cors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = { createToken, verifyToken, getAuthUser, cors, JWT_SECRET, ADMIN_EMAILS, getPool };
