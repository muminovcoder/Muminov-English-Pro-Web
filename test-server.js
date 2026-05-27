// test-server.js - Minimal test server (HECH QANDAY DATABASE YO'Q)
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ✅ API: Health check (har doim JSON qaytaradi)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server ishlamoqda!', time: new Date().toISOString() });
});

// ✅ API: Config
app.get('/api/config', (req, res) => {
  res.json({ appName: 'Muminov English Pro', version: '1.0.0' });
});

// ✅ API: Join (nickname) - DATABASESIZ, faqat test uchun
app.post('/api/auth/join', (req, res) => {
  const { username } = req.body;
  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Nickname kamida 3 ta belgi' });
  }
  // Fake token (test uchun)
  const fakeToken = 'fake_token_' + Date.now();
  res.json({ 
    message: 'Muvaffaqiyatli', 
    user: { id: 1, username }, 
    token: fakeToken 
  });
});

// ✅ API: Me
app.get('/api/auth/me', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token yo\'q' });
  res.json({ user: { id: 1, username: 'TestUser', email: 'test@placeholder.local' } });
});

// ✅ API: Books
app.get('/api/books', (req, res) => {
  res.json({ 
    books: [
      { id: 1, title: 'Vocabulary for IELTS', author: 'Cambridge', level: 'Advanced', description: 'IELTS so\'zlar' },
      { id: 2, title: 'Academic Grammar', author: 'Oxford', level: 'Intermediate', description: 'Grammatika' },
      { id: 3, title: 'Business English', author: 'Pearson', level: 'Intermediate', description: 'Biznes tili' }
    ] 
  });
});

// ✅ API: Select book
app.post('/api/books/select', (req, res) => {
  res.json({ message: 'Kitob tanlandi', bookId: req.body.bookId });
});

// ✅ API: Online users
app.get('/api/presence/online', (req, res) => {
  res.json({ count: Math.floor(Math.random() * 50) + 1, online: [] });
});

// ✅ API: Heartbeat
app.post('/api/presence/heartbeat', (req, res) => {
  res.json({ success: true });
});

// ❌ 404 handler for API (JSON qaytaradi!)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint topilmadi' });
});

// 🌐 Frontend fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 🚀 Serverni ishga tushirish
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ TEST SERVER: http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
});
