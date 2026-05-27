// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/connection');
const router = express.Router();

// Ro'yxatdan o'tish / Login (birlashtirilgan - nickname uchun)
router.post('/join', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Agar faqat username kelsa (nickname login)
    if (username && !email && !password) {
      // Foydalanuvchini topish yoki yaratish
      let result = await query('SELECT id, username, email FROM users WHERE username = $1', [username]);
      
      if (result.rows.length === 0) {
        // Yangi foydalanuvchi yaratish
        result = await query(
          'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
          [username, `${username.toLowerCase()}@placeholder.local`, 'placeholder_hash']
        );
      }

      const user = result.rows[0];
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'muminov_secret_2026',
        { expiresIn: '30d' }
      );

      return res.status(200).json({ 
        message: 'Muvaffaqiyatli', 
        user: { id: user.id, username: user.username, email: user.email },
        token 
      });
    }
    
    // To'liq ro'yxatdan o'tish (email + password)
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Barcha maydonlarni to\'ldiring' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'muminov_secret_2026',
      { expiresIn: '30d' }
    );

    res.status(201).json({ 
      message: 'Muvaffaqiyatli ro\'yxatdan o\'tdi', 
      user: { id: user.id, username: user.username, email: user.email },
      token 
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Server xatoligi: ' + err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email va parolni kiriting' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'muminov_secret_2026',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Muvaffaqiyatli kirdi',
      user: { id: user.id, username: user.username, email: user.email },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server xatoligi: ' + err.message });
  }
});

// Foydalanuvchi ma'lumotlari
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Token yo\'q' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'muminov_secret_2026');
    const result = await query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Auth/me error:', err);
    res.status(401).json({ error: 'Token noto\'g\'ri yoki muddati o\'tgan' });
  }
});

module.exports = router;
