const mysql = require('mysql2/promise');

let pool = null;

function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
            user: process.env.DB_USER || '2mutHwzd3LgsP27.root',
            password: process.env.DB_PASSWORD || '6UHbDtAymvvn1Vpe',
            database: process.env.DB_NAME || 'dcover',
            port: process.env.DB_PORT || 4000,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
            ssl: { rejectUnauthorized: true }
        });
    }
    return pool;
}

module.exports = { getPool };
