// server/db/connection.js
const { Pool } = require('pg');
require('dotenv').config();

// Neon uchun maxsus sozlamalar
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Neon uchun kerak
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('✅ Neon PostgreSQL ga muvaffaqiyatli ulandi');
});

pool.on('error', (err) => {
  console.error('❌ Neon DB xatoligi:', err.message);
});

// Ulanishni tekshirish funksiyasi
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as connected_at, version() as db_version');
    client.release();
    console.log('🟢 DB Test:', result.rows[0]);
    return true;
  } catch (err) {
    console.error('🔴 DB Ulanish xatoligi:', err.message);
    return false;
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  testConnection,
};
