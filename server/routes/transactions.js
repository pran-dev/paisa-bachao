const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

// All routes protected
router.use(authMiddleware);

// GET /api/transactions - Fetch all transactions for current user
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const { month, year, type, search, startDate, endDate } = req.query;

  let query = 'SELECT * FROM transactions WHERE user_id = ?';
  const params = [userId];

  if (month && year) {
    query += ' AND MONTH(date) = ? AND YEAR(date) = ?';
    params.push(parseInt(month), parseInt(year));
  }

  if (startDate && endDate) {
    query += ' AND date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  if (type && (type === 'needs' || type === 'wants')) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (search) {
    query += ' AND (title LIKE ? OR subcategory LIKE ? OR note LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY date DESC, created_at DESC';

  try {
    const [rows] = await db.query(query, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get transactions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
  }
});

// GET /api/transactions/summary - Monthly summary for dashboard
router.get('/summary', async (req, res) => {
  const userId = req.user.id;
  const month = req.query.month || new Date().getMonth() + 1;
  const year = req.query.year || new Date().getFullYear();

  try {
    // Total spent by type
    const [typeSummary] = await db.query(
      `SELECT type, SUM(amount) as total, COUNT(*) as count
       FROM transactions
       WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
       GROUP BY type`,
      [userId, month, year]
    );

    // Spending by subcategory
    const [subcategorySummary] = await db.query(
      `SELECT subcategory, type, SUM(amount) as total, COUNT(*) as count
       FROM transactions
       WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
       GROUP BY subcategory, type
       ORDER BY total DESC`,
      [userId, month, year]
    );

    // Daily spending trend (last 30 days)
    const [dailyTrend] = await db.query(
      `SELECT DATE_FORMAT(date, '%Y-%m-%d') as day, SUM(amount) as total
       FROM transactions
       WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
       GROUP BY day
       ORDER BY day ASC`,
      [userId, month, year]
    );

    return res.json({
      success: true,
      data: { typeSummary, subcategorySummary, dailyTrend }
    });
  } catch (err) {
    console.error('Summary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch summary.' });
  }
});

// POST /api/transactions - Add a new transaction
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { title, amount, type, subcategory, date, note } = req.body;

  if (!title || !amount || !type || !subcategory || !date) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
  }

  if (!['needs', 'wants'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Type must be needs or wants.' });
  }

  if (isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO transactions (user_id, title, amount, type, subcategory, date, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, title.trim(), parseFloat(amount), type, subcategory, date, note || null]
    );

    const [newTx] = await db.query('SELECT * FROM transactions WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Transaction added!',
      data: newTx[0]
    });
  } catch (err) {
    console.error('Add transaction error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add transaction.' });
  }
});

// PUT /api/transactions/:id - Update a transaction
router.put('/:id', async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, amount, type, subcategory, date, note } = req.body;

  try {
    // Ownership check
    const [rows] = await db.query('SELECT id FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    await db.query(
      'UPDATE transactions SET title = ?, amount = ?, type = ?, subcategory = ?, date = ?, note = ? WHERE id = ?',
      [title, parseFloat(amount), type, subcategory, date, note || null, id]
    );

    const [updated] = await db.query('SELECT * FROM transactions WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Transaction updated!', data: updated[0] });
  } catch (err) {
    console.error('Update transaction error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update transaction.' });
  }
});

// DELETE /api/transactions/:id - Delete a transaction
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT id FROM transactions WHERE id = ? AND user_id = ?', [id, userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    await db.query('DELETE FROM transactions WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Transaction deleted!' });
  } catch (err) {
    console.error('Delete transaction error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete transaction.' });
  }
});

module.exports = router;

