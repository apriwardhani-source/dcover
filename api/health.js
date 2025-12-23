const { cors } = require('./_lib/auth');

module.exports = async function handler(req, res) {
    cors(res);
    res.json({ status: 'ok', message: 'dcover API is running on Vercel' });
};
