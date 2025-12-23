// Vercel Serverless API Handler
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('../server/routes/auth'));
app.use('/api/users', require('../server/routes/users'));
app.use('/api/songs', require('../server/routes/songs'));
app.use('/api/albums', require('../server/routes/albums'));
app.use('/api/banners', require('../server/routes/banners'));
app.use('/api/comments', require('../server/routes/comments'));
app.use('/api/follows', require('../server/routes/follows'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'dcover API is running on Vercel' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Export for Vercel
module.exports = app;
