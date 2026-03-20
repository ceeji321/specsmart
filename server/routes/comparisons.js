import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET /api/comparisons
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('device_comparisons')
      .select('id, device1_name, device2_name, created_at')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const now = new Date();
    const todayStart     = new Date(now); todayStart.setHours(0,0,0,0);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const items = (data || [])
      // FIX: filter out blank comparisons saved from Android app with empty names
      .filter(row => {
        const d1 = (row.device1_name || '').trim();
        const d2 = (row.device2_name || '').trim();
        return d1.length > 0 && d2.length > 0;
      })
      .map(row => {
        const createdAt = new Date(row.created_at);
        let dateLabel = 'last7days';
        if (createdAt >= todayStart)          dateLabel = 'today';
        else if (createdAt >= yesterdayStart) dateLabel = 'yesterday';

        return {
          id:    row.id,
          title: `${row.device1_name} vs ${row.device2_name}`,
          time:  createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          date:  dateLabel,
          type:  'comparison',
          messages: [
            { role: 'user',      content: `Compare ${row.device1_name} vs ${row.device2_name}` },
            { role: 'assistant', content: `Comparison between **${row.device1_name}** and **${row.device2_name}**.` },
          ],
        };
      });

    res.json({ comparisons: items });
  } catch (error) {
    console.error('Get comparisons error:', error);
    res.status(500).json({ error: 'Failed to get comparisons' });
  }
});

// POST /api/comparisons
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { device1_name, device2_name } = req.body;

    // FIX: reject empty device names to prevent blank "vs" rows
    if (!device1_name || !device2_name)
      return res.status(400).json({ error: 'device1_name and device2_name are required' });

    const d1 = device1_name.trim();
    const d2 = device2_name.trim();
    if (!d1 || !d2)
      return res.status(400).json({ error: 'device names cannot be empty' });

    // Avoid duplicate within 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('device_comparisons')
      .select('id')
      .eq('user_id', req.user.userId)
      .eq('device1_name', d1)
      .eq('device2_name', d2)
      .gte('created_at', oneHourAgo)
      .limit(1);

    if (existing?.length > 0)
      return res.json({ comparison: existing[0], skipped: true });

    const { data, error } = await supabase
      .from('device_comparisons')
      .insert({ user_id: req.user.userId, device1_name: d1, device2_name: d2 })
      .select('id, device1_name, device2_name, created_at')
      .single();

    if (error) throw error;
    res.status(201).json({ comparison: data });
  } catch (error) {
    console.error('Save comparison error:', error);
    res.status(500).json({ error: 'Failed to save comparison' });
  }
});

// DELETE /api/comparisons
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ error: 'ids array is required' });

    const { error } = await supabase
      .from('device_comparisons')
      .delete()
      .in('id', ids)
      .eq('user_id', req.user.userId);

    if (error) throw error;
    res.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('Delete comparisons error:', error);
    res.status(500).json({ error: 'Failed to delete comparisons' });
  }
});

export default router;