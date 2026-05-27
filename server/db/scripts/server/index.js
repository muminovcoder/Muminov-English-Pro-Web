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

// CORS - barcha manbalarga ruxsat (development uchun)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON parser - katta body uchun
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Statik fayllar
app.use(express.static(path.join(__dirname, '..')));

// API Routelari
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/presence', presenceRoutes);

// Health check - HAR DOIM JSON qaytaradi
app.get('/api/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler - JSON qaytaradi
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Endpoint topilmadi' });
  } else {
    next();
  }
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint topilmadi' });
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Server xatoligi: ' + err.message });
});

// Database init
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
  
  // Test books
  const count = await pool.query('SELECT COUNT(*) FROM books');
  if (parseInt(count.rows[0].count) === 0) {
    await seedBooks();
  }
}

async function seedBooks() {
  const books = [
    { title: "Vocabulary for IELTS Advanced", author: "Cambridge", level: "Advanced", description: "IELTS uchun so'z boyligi", cover_url: "" },
    { title: "Academic English Grammar", author: "Oxford", level: "Intermediate", description: "Akademik grammatika", cover_url: "" },
    { title: "Business English", author: "Pearson", level: "Intermediate", description: "Biznes ingliz tili", cover_url: "" },
    { title: "English Pronunciation", author: "BBC", level: "Beginner", description: "Talaffuzni o'rganish", cover_url: "" }
  ];
  
  for (const b of books) {
    await pool.query(
      `INSERT INTO books (title, author, level, description, cover_url) VALUES ($1, $2, $3, $4, $5)`,
      [b.title, b.author, b.level, b.description, b.cover_url]
    );
  }
}

// Server start
async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database ulandi');
    
    await initializeDatabase();
    console.log('✅ Jadvalar tayyor');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server http://localhost:${PORT} da ishlayapti`);
    });
  } catch (err) {
    console.error('❌ Server xatoligi:', err.message);
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
