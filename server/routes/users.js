// server/routes/users.js
import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// GET /api/users/profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at, last_login FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PUT /api/users/profile — update name and/or email
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name && !email)
      return res.status(400).json({ error: 'Name or email is required' });

    if (email) {
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), req.user.userId]
      );
      if (existing.rows.length > 0)
        return res.status(409).json({ error: 'Email already in use by another account' });
    }

    const current = await pool.query(
      'SELECT name, email FROM users WHERE id = $1',
      [req.user.userId]
    );
    const currentUser = current.rows[0];

    const newName = name || currentUser.name;
    const newEmail = email ? email.toLowerCase() : currentUser.email;

    const result = await pool.query(
      `UPDATE users SET name = $1, email = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, name, role, created_at`,
      [newName, newEmail, req.user.userId]
    );
    res.json({ user: result.rows[0], message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/password-reset-request
router.post('/password-reset-request', authenticateToken, async (req, res) => {
  try {
    const { reason } = req.body;

    const existing = await pool.query(
      `SELECT id FROM password_reset_requests WHERE user_id = $1 AND status = 'pending'`,
      [req.user.userId]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'You already have a pending password reset request' });

    await pool.query(
      `INSERT INTO password_reset_requests (user_id, reason, status, created_at)
       VALUES ($1, $2, 'pending', NOW())`,
      [req.user.userId, reason || null]
    );

    res.status(201).json({ message: 'Password reset request submitted. An admin will process it shortly.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// GET /api/users/password-reset-request/status
router.get('/password-reset-request/status', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, status, reason, created_at, resolved_at
       FROM password_reset_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.userId]
    );
    res.json({ request: result.rows[0] || null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get request status' });
  }
});

export default router;