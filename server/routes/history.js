// server/routes/history.js
import express from 'express';
import { authenticateToken } from '../../server/middleware/auth.js';
import pool from '../../server/config/database.js';

const router = express.Router();

// GET /api/history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, messages, message, response, created_at, is_archived
       FROM chat_history
       WHERE user_id = $1
       ORDER BY created_at DESC`,
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

      let messages = [];
      if (row.messages && Array.isArray(row.messages) && row.messages.length > 0) {
        messages = row.messages;
      } else if (row.message || row.response) {
        messages = [
          { role: 'user',      content: row.message  || '' },
          { role: 'assistant', content: row.response || '' },
        ];
      }

      const firstUserMsg = messages.find(m => m.role === 'user');
      const hasImage = !!firstUserMsg?.image;
      const displayTitle = row.title
        || (hasImage ? `📷 ${firstUserMsg?.content || 'Image scan'}` : null)
        || firstUserMsg?.content?.slice(0, 60)
        || 'Chat';

      return {
        id:         row.id,
        title:      displayTitle,
        time:       createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        // FIX: include created_at ISO string so Android app shows correct timestamps
        created_at: row.created_at,
        date:       dateLabel,
        archived:   row.is_archived,
        messages,
        hasImage,
        imageThumb: hasImage ? firstUserMsg.image : null,
        imageMime:  hasImage ? (firstUserMsg.imageMime || 'image/jpeg') : null,
      };
    });

    res.json({ history: items });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// POST /api/history
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, messages } = req.body;
    if (!title || !messages)
      return res.status(400).json({ error: 'title and messages are required' });

    const result = await pool.query(
      `INSERT INTO chat_history (user_id, title, messages, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, title, created_at`,
      [req.user.userId, title, JSON.stringify(messages)]
    );
    res.status(201).json({ history: result.rows[0] });
  } catch (error) {
    console.error('Save history error:', error);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

// PUT /api/history/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, messages } = req.body;
    if (!title || !messages)
      return res.status(400).json({ error: 'title and messages are required' });

    const result = await pool.query(
      `UPDATE chat_history
       SET title = $1, messages = $2
       WHERE id = $3 AND user_id = $4
       RETURNING id, title, created_at`,
      [title, JSON.stringify(messages), req.params.id, req.user.userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Chat not found' });

    res.json({ history: result.rows[0] });
  } catch (error) {
    console.error('Update history error:', error);
    res.status(500).json({ error: 'Failed to update history' });
  }
});

// DELETE /api/history/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM chat_history WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// DELETE /api/history — multiple
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'ids required' });
    await pool.query(
      'DELETE FROM chat_history WHERE id = ANY($1) AND user_id = $2',
      [ids, req.user.userId]
    );
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// PATCH /api/history/archive
router.patch('/archive', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'ids required' });
    await pool.query(
      'UPDATE chat_history SET is_archived = true WHERE id = ANY($1) AND user_id = $2',
      [ids, req.user.userId]
    );
    res.json({ message: 'Archived successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive' });
  }
});

export default router;