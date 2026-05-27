// server/routes/presence.js
const express = require('express');
const { query } = require('../db/connection');
const auth = require('../middleware/auth');
const router = express.Router();

// Heartbeat - foydalanuvchi onlayn ekanligini yangilash
router.post('/heartbeat', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    await query(
      `INSERT INTO user_presence (user_id, last_seen) 
       VALUES ($1, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET last_seen = NOW()`,
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Heartbeat error:', err);
    res.status(500).json({ error: 'Holatni yangilashda xatolik' });
  }
});

// Onlayn foydalanuvchilar
router.get('/online', async (req, res) => {
  try {
    // So'nggi 5 daqiqada faol bo'lgan foydalanuvchilar
    const result = await query(
      `SELECT u.id, u.username, up.last_seen 
       FROM user_presence up
       JOIN users u ON up.user_id = u.id
       WHERE up.last_seen > NOW() - INTERVAL '5 minutes'
       ORDER BY up.last_seen DESC`
    );
    
    res.json({ 
      online: result.rows.map(row => ({
        id: row.id,
        username: row.username,
        lastSeen: row.last_seen
      })),
      count: result.rows.length
    });
  } catch (err) {
    console.error('Presence error:', err);
    res.status(500).json({ error: 'Onlayn foydalanuvchilarni olishda xatolik' });
  }
});

module.exports = router;
