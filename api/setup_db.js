const { getPool } = require('./lib/auth');

module.exports = async function handler(req, res) {
    const pool = getPool();

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user1_id INT NOT NULL,
                user2_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                conversation_id INT NOT NULL,
                sender_id INT NOT NULL,
                content TEXT NOT NULL,
                is_read TINYINT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        return res.status(200).json({ success: true, message: 'Tables created successfully!' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
