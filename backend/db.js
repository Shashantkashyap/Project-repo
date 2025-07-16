require('dotenv').config();
const mysql = require('mysql2/promise');

// Create a pool of connections for better scalability
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export a query function that returns a promise
const db = {
  query: async (sql, params) => {
    const [results] = await pool.execute(sql, params);
    return results;
  },
  getConnection: () => pool.getConnection()
};

module.exports = db;
