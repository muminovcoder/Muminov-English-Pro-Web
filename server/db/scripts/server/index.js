// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const presenceRoutes = require('./routes/presence');
const { pool } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik fayllar (frontend)
app.use(express.static(path.join(__dirname, '..')));

// API Routelari
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/presence', presenceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// React/SPA fallback - barcha yo'llarni index.html ga yo'naltirish
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint topilmadi' });
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Xatoliklarni ushlash
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Ichki server xatoligi' });
});

// Serverni ishga tushirish
async function startServer() {
  try {
    // DB ulanishini tekshirish
    await pool.query('SELECT NOW()');
    console.log('✅ Database ulandi');

    // Jadvallarni yaratish (agar mavjud bo'lmasa)
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server http://localhost:${PORT} da ishlayapti`);
    });
  } catch (err) {
    console.error('❌ Serverni ishga tushirib bo\'lmadi:', err.message);
    process.exit(1);
  }
}

// Database jadvallarini yaratish
async function initializeDatabase() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(150),
      level VARCHAR(50),
      description TEXT,
      cover_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS user_books (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
      progress INTEGER DEFAULT 0,
      last_read_at TIMESTAMP,
      selected_at TIMESTAMP DEFAULT NOW(),
      PRIMARY KEY (user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS user_presence (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      last_seen TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_presence_seen ON user_presence(last_seen)`
  ];

  for (const sql of tables) {
    await pool.query(sql);
  }
  console.log('✅ Jadvalar tayyor');
  
  // Test ma'lumotlari (agar books bo'sh bo'lsa)
  const count = await pool.query('SELECT COUNT(*) FROM books');
  if (parseInt(count.rows[0].count) === 0) {
    await seedBooks();
  }
}

// Test kitoblarini qo'shish
async function seedBooks() {
  const sampleBooks = [
    {
      title: "English for Beginners",
      author: "John Smith",
      level: "Beginner",
      description: "Asosiy ingliz tili qoidalari va so'zlar",
      cover_url: "https://via.placeholder.com/200x300?text=Beginner"
    },
    {
      title: "Intermediate Grammar",
      author: "Emma Wilson",
      level: "Intermediate",
      description: "O'rta daraja grammatika va muloqot",
      cover_url: "https://via.placeholder.com/200x300?text=Intermediate"
    },
    {
      title: "Advanced Conversation",
      author: "Michael Brown",
      level: "Advanced",
      description: "Murakkab mavzular va professional muloqot",
      cover_url: "https://via.placeholder.com/200x300?text=Advanced"
    }
  ];
  
  for (const book of sampleBooks) {
    await pool.query(
      `INSERT INTO books (title, author, level, description, cover_url) 
       VALUES ($1, $2, $3, $4, $5)`,
      [book.title, book.author, book.level, book.description, book.cover_url]
    );
  }
  console.log('📚 Test kitoblari qo\'shildi');
}

startServer();

// To'xtatish signallari
process.on('SIGINT', async () => {
  console.log('\n🔄 Server to\'xtatilmoqda...');
  await pool.end();
  process.exit(0);
});
