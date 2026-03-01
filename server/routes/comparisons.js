// server/routes/comparisons.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// GET /api/comparisons — get user's comparison history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, device1_name, device2_name, created_at
       FROM comparisons
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.userId]
    );

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const items = result.rows.map(row => {
      const createdAt = new Date(row.created_at);
      let dateLabel = 'last7days';
      if (createdAt >= todayStart) dateLabel = 'today';
      else if (createdAt >= yesterdayStart) dateLabel = 'yesterday';

      return {
        id: row.id,
        title: `${row.device1_name} vs ${row.device2_name}`,
        time: createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: dateLabel,
        type: 'comparison',
        messages: [
          { role: 'user', content: `Compare ${row.device1_name} vs ${row.device2_name}` },
          { role: 'assistant', content: `Comparison between **${row.device1_name}** and **${row.device2_name}** — view the Compare page for full details.` }
        ]
      };
    });

    res.json({ comparisons: items });
  } catch (error) {
    console.error('Get comparisons error:', error);
    res.status(500).json({ error: 'Failed to get comparisons' });
  }
});

// POST /api/comparisons — save a comparison
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { device1_name, device2_name, device1_id, device2_id } = req.body;
    if (!device1_name || !device2_name) {
      return res.status(400).json({ error: 'device1_name and device2_name are required' });
    }

    // Avoid duplicate saves within 1 hour
    const existing = await pool.query(
      `SELECT id FROM comparisons 
       WHERE user_id = $1 AND device1_name = $2 AND device2_name = $3
       AND created_at > NOW() - INTERVAL '1 hour'`,
      [req.user.userId, device1_name, device2_name]
    );

    if (existing.rows.length > 0) {
      return res.json({ comparison: existing.rows[0], skipped: true });
    }

    const result = await pool.query(
      `INSERT INTO comparisons (user_id, device1_name, device2_name, device1_id, device2_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, device1_name, device2_name, created_at`,
      [req.user.userId, device1_name, device2_name, device1_id || null, device2_id || null]
    );

    res.status(201).json({ comparison: result.rows[0] });
  } catch (error) {
    console.error('Save comparison error:', error);
    res.status(500).json({ error: 'Failed to save comparison' });
  }
});

export default router;