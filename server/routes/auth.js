const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
require('dotenv').config();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  try {
    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase(), password_hash]
    );

    const user = { id: result.insertId, email: email.toLowerCase(), name: name.trim() };
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: user.id, name: user.name, email: user.email, monthly_allowance: 0, needs_percentage: 60, wants_percentage: 40 }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];

    if (!user.password_hash) {
      return res.status(401).json({ success: false, message: 'This account uses Google Sign-In. Please use that option.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        monthly_allowance: user.monthly_allowance,
        needs_percentage: user.needs_percentage,
        wants_percentage: user.wants_percentage,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// POST /api/auth/google-access  (access_token flow via useGoogleLogin)
router.post('/google-access', async (req, res) => {
  const { access_token, userInfo } = req.body;

  if (!access_token || !userInfo) {
    return res.status(400).json({ success: false, message: 'Google access token and user info required.' });
  }

  try {
    // Verify token by fetching from Google
    const verifyRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!verifyRes.ok) {
      return res.status(401).json({ success: false, message: 'Invalid Google access token.' });
    }

    const verifiedInfo = await verifyRes.json();
    const { sub: google_id, email, name, picture: avatar_url } = verifiedInfo;

    const [existing] = await db.query('SELECT * FROM users WHERE google_id = ? OR email = ?', [google_id, email]);
    let user;
    if (existing.length > 0) {
      user = existing[0];
      if (!user.google_id) {
        await db.query('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?', [google_id, avatar_url, user.id]);
        user.google_id = google_id;
        user.avatar_url = avatar_url;
      }
    } else {
      const [result] = await db.query(
        'INSERT INTO users (name, email, google_id, avatar_url) VALUES (?, ?, ?, ?)',
        [name, email, google_id, avatar_url]
      );
      const [newUser] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUser[0];
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Google login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        monthly_allowance: user.monthly_allowance,
        needs_percentage: user.needs_percentage,
        wants_percentage: user.wants_percentage,
      }
    });
  } catch (err) {
    console.error('Google access-token auth error:', err);
    return res.status(500).json({ success: false, message: 'Google authentication failed.' });
  }
});

// POST /api/auth/google  (id_token / credential flow via GoogleLogin button)
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google credential is required.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: google_id, email, name, picture: avatar_url } = payload;

    // Check if user exists (by google_id or email)
    const [existing] = await db.query('SELECT * FROM users WHERE google_id = ? OR email = ?', [google_id, email]);

    let user;
    if (existing.length > 0) {
      user = existing[0];
      // Update google_id if logged in via email before
      if (!user.google_id) {
        await db.query('UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?', [google_id, avatar_url, user.id]);
        user.google_id = google_id;
        user.avatar_url = avatar_url;
      }
    } else {
      // Create new user
      const [result] = await db.query(
        'INSERT INTO users (name, email, google_id, avatar_url) VALUES (?, ?, ?, ?)',
        [name, email, google_id, avatar_url]
      );
      const [newUser] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUser[0];
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Google login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        monthly_allowance: user.monthly_allowance,
        needs_percentage: user.needs_percentage,
        wants_percentage: user.wants_percentage,
      }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ success: false, message: 'Google authentication failed.' });
  }
});

module.exports = router;
