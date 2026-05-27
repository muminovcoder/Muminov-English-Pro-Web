// server/routes/books.js
const express = require('express');
const { query } = require('../db/connection');
const auth = require('../middleware/auth');
const router = express.Router();

// Barcha kitoblarni olish
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT id, title, author, level, description, cover_url FROM books ORDER BY title');
    res.json({ books: result.rows || [] });
  } catch (err) {
    console.error('Books fetch error:', err);
    res.status(500).json({ error: 'Kitoblarni olishda xatolik: ' + err.message, books: [] });
  }
});

// Kitob tanlash
router.post('/select', auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    if (!bookId) {
      return res.status(400).json({ error: 'bookId kerak' });
    }

    const book = await query('SELECT id FROM books WHERE id = $1', [bookId]);
    if (book.rows.length === 0) {
      return res.status(404).json({ error: 'Kitob topilmadi' });
    }

    await query(
      `INSERT INTO user_books (user_id, book_id, selected_at) 
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET book_id = $2, selected_at = NOW(), progress = 0`,
      [userId, bookId]
    );

    res.json({ message: 'Kitob muvaffaqiyatli tanlandi', bookId });
  } catch (err) {
    console.error('Book select error:', err);
    res.status(500).json({ error: 'Kitobni tanlashda xatolik: ' + err.message });
  }
});

// Foydalanuvchining kitobi
router.get('/my', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT b.*, ub.progress, ub.last_read_at 
       FROM user_books ub
       JOIN books b ON ub.book_id = b.id
       WHERE ub.user_id = $1`,
      [userId]
    );
    
    res.json({ book: result.rows[0] || null });
  } catch (err) {
    console.error('My book error:', err);
    res.status(500).json({ error: 'Ma\'lumot olishda xatolik: ' + err.message });
  }
});

module.exports = router;
