// server/routes/manager.js
import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();
const SALT_ROUNDS = 10;
const isManagerRole = authorizeRole('manager', 'admin');
const isAdminRole = authorizeRole('admin');

// ── SSE: realtime user feed ───────────────────────────────────────────────────
const sseClients = new Set();

export function broadcastUserEvent(type, data) {
  const msg = `data: ${JSON.stringify({ type, data })}\n\n`;
  for (const res of sseClients) {
    try { res.write(msg); } catch (_) { sseClients.delete(res); }
  }
}

router.get('/stream', authenticateToken, isAdminRole, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write('data: {"type":"connected"}\n\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// ── Ensure audit tables exist ─────────────────────────────────────────────────
async function ensureAuditTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS deleted_users (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        email TEXT NOT NULL,
        name TEXT,
        role TEXT,
        deleted_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_by_id TEXT,
        deleted_by_email TEXT
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS archived_users (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        email TEXT NOT NULL,
        name TEXT,
        role TEXT,
        archived_at TIMESTAMPTZ DEFAULT NOW(),
        archived_by_id TEXT,
        archived_by_email TEXT,
        reason TEXT
      )
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ
    `);
  } finally {
    client.release();
  }
}
ensureAuditTables().catch(console.error);

// ── GET /users ────────────────────────────────────────────────────────────────
router.get('/users', authenticateToken, isManagerRole, async (req, res) => {
  const client = await pool.connect();
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = ['(is_archived = FALSE OR is_archived IS NULL)'];
    const params = [];
    let i = 1;

    if (role && ['user', 'admin'].includes(role)) {
      conditions.push(`role = $${i++}`);
      params.push(role);
    }
    if (search) {
      conditions.push(`(email ILIKE $${i} OR name ILIKE $${i})`);
      params.push(`%${search}%`);
      i++;
    }

    const where = 'WHERE ' + conditions.join(' AND ');

    const countRes = await client.query(
      `SELECT COUNT(*) FROM users ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    const result = await client.query(
      `SELECT id, email, name, role, created_at, last_login FROM users ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)) || 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  } finally { client.release(); }
});

// ── GET /users/:id ────────────────────────────────────────────────────────────
router.get('/users/:id', authenticateToken, isManagerRole, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, email, name, role, created_at, last_login FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve user.' });
  } finally { client.release(); }
});

// ── POST /users (create) ──────────────────────────────────────────────────────
router.post('/users', authenticateToken, isManagerRole, async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, name, role = 'user' } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ success: false, message: 'Email, password, and name are required.' });
    if (role === 'admin' && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Only admins can create admin accounts.' });
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await client.query(
      'INSERT INTO users (email, password, name, role, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING id, email, name, role, created_at',
      [email.toLowerCase(), hashed, name, role]
    );
    const newUser = result.rows[0];
    broadcastUserEvent('user_created', newUser);
    res.status(201).json({ success: true, message: 'User created successfully.', data: newUser });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Failed to create user.' });
  } finally { client.release(); }
});

// ── PUT /users/:id (edit) ─────────────────────────────────────────────────────
router.put('/users/:id', authenticateToken, isManagerRole, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, role } = req.body;
    const current = await client.query('SELECT role FROM users WHERE id = $1', [id]);
    if (current.rows.length === 0)
      return res.status(404).json({ success: false, message: 'User not found.' });
    if (req.user.role !== 'admin' && role && role !== current.rows[0].role)
      return res.status(403).json({ success: false, message: 'Only admins can change user roles.' });
    const updates = []; const params = []; let i = 1;
    if (name) { updates.push(`name = $${i++}`); params.push(name); }
    if (role && ['user', 'admin'].includes(role)) { updates.push(`role = $${i++}`); params.push(role); }
    if (updates.length === 0)
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    params.push(id);
    const result = await client.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, email, name, role, created_at, last_login`,
      params
    );
    const updated = result.rows[0];
    broadcastUserEvent('user_updated', updated);
    res.json({ success: true, message: 'User updated successfully.', data: updated });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  } finally { client.release(); }
});

// ── DELETE /users/:id ─────────────────────────────────────────────────────────
router.delete('/users/:id', authenticateToken, isAdminRole, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    if (id === String(req.user.userId))
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    const userRes = await client.query('SELECT id, email, name, role FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0)
      return res.status(404).json({ success: false, message: 'User not found.' });
    const u = userRes.rows[0];
    await client.query(
      `INSERT INTO deleted_users (user_id, email, name, role, deleted_by_id, deleted_by_email)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [String(u.id), u.email, u.name, u.role, String(req.user.userId), req.user.email]
    );
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    broadcastUserEvent('user_deleted', { id });
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  } finally { client.release(); }
});

// ── POST /users/:id/archive ───────────────────────────────────────────────────
router.post('/users/:id/archive', authenticateToken, isAdminRole, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (id === String(req.user.userId))
      return res.status(400).json({ success: false, message: 'You cannot archive your own account.' });
    const userRes = await client.query('SELECT id, email, name, role FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0)
      return res.status(404).json({ success: false, message: 'User not found.' });
    const u = userRes.rows[0];
    await client.query(
      `INSERT INTO archived_users (user_id, email, name, role, archived_by_id, archived_by_email, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [String(u.id), u.email, u.name, u.role, String(req.user.userId), req.user.email, reason || null]
    );
    await client.query('UPDATE users SET is_archived = TRUE WHERE id = $1', [id]);
    broadcastUserEvent('user_archived', { id });
    res.json({ success: true, message: 'User archived successfully.' });
  } catch (error) {
    console.error('Archive error:', error);
    res.status(500).json({ success: false, message: 'Failed to archive user.' });
  } finally { client.release(); }
});

// ── POST /users/:id/unarchive ─────────────────────────────────────────────────
router.post('/users/:id/unarchive', authenticateToken, isAdminRole, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('UPDATE users SET is_archived = FALSE WHERE id = $1', [req.params.id]);
    broadcastUserEvent('user_unarchived', { id: req.params.id });
    res.json({ success: true, message: 'User unarchived successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unarchive user.' });
  } finally { client.release(); }
});

// ── GET /deleted-users ────────────────────────────────────────────────────────
router.get('/deleted-users', authenticateToken, isAdminRole, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM deleted_users ORDER BY deleted_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve deleted users.' });
  } finally { client.release(); }
});

// ── GET /archived-users ───────────────────────────────────────────────────────
router.get('/archived-users', authenticateToken, isAdminRole, async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM archived_users ORDER BY archived_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve archived users.' });
  } finally { client.release(); }
});

// ── GET /statistics ───────────────────────────────────────────────────────────
router.get('/statistics', authenticateToken, isManagerRole, async (req, res) => {
  const client = await pool.connect();
  try {
    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE is_archived = FALSE OR is_archived IS NULL) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'user' AND (is_archived = FALSE OR is_archived IS NULL)) as regular_users,
        (SELECT COUNT(*) FROM users WHERE role = 'admin' AND (is_archived = FALSE OR is_archived IS NULL)) as admins,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d
    `);
    res.json({ success: true, data: stats.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve statistics.' });
  } finally { client.release(); }
});

// ── POST /users/:id/reset-password ───────────────────────────────────────────
router.post('/users/:id/reset-password', authenticateToken, isAdminRole, async (req, res) => {
  const client = await pool.connect();
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
    await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.params.id]);
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  } finally { client.release(); }
});

export default router;