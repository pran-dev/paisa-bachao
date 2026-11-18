const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// All routes protected
router.use(authMiddleware);

// GET /api/user/profile - Get current user profile
router.get('/profile', async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      'SELECT id, name, email, avatar_url, monthly_allowance, needs_percentage, wants_percentage, currency, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', async (req, res) => {
  const userId = req.user.id;
  const { name, monthly_allowance, needs_percentage, wants_percentage } = req.body;

  if (needs_percentage + wants_percentage !== 100) {
    return res.status(400).json({ success: false, message: 'Needs and Wants percentages must add up to 100%.' });
  }

  try {
    await db.query(
      'UPDATE users SET name = ?, monthly_allowance = ?, needs_percentage = ?, wants_percentage = ? WHERE id = ?',
      [name, parseFloat(monthly_allowance) || 0, parseInt(needs_percentage), parseInt(wants_percentage), userId]
    );

    const [updated] = await db.query(
      'SELECT id, name, email, avatar_url, monthly_allowance, needs_percentage, wants_percentage, currency, created_at FROM users WHERE id = ?',
      [userId]
    );

    return res.json({ success: true, message: 'Profile updated successfully!', data: updated[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

module.exports = router;

