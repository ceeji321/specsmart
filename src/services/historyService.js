import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://specsmart-production-ed74.up.railway.app';

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function fetchHistory() {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/api/history`, { headers });
    if (!res.ok) throw new Error('Failed to fetch history');
    const data = await res.json();
    return data.history || [];
  } catch (err) { console.error('fetchHistory error:', err); return []; }
}

export async function saveChat(title, messages, chatId = null) {
  try {
    const cleanMessages = messages
      .filter(m => m.role && (m.content || m.image))
      .map(m => ({
        role: m.role,
        content: m.content || '',
        ...(m.image && { image: m.image, imageMime: m.imageMime || 'image/jpeg' }),
      }));
    if (cleanMessages.length < 2) return null;
    const headers = await getHeaders();

    if (chatId) {
      const res = await fetch(`${API_BASE}/api/history/${chatId}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ title: title.slice(0, 100), messages: cleanMessages }),
      });
      if (!res.ok) return null;
      return (await res.json()).history;
    }

    const res = await fetch(`${API_BASE}/api/history`, {
      method: 'POST', headers,
      body: JSON.stringify({ title: title.slice(0, 100), messages: cleanMessages }),
    });
    if (!res.ok) return null;
    return (await res.json()).history;
  } catch (err) { console.error('saveChat error:', err); return null; }
}

export async function deleteHistory(ids) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/api/history`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ ids }),
    });
    return res.ok;
  } catch (err) { console.error('deleteHistory error:', err); return false; }
}

export async function deleteComparisons(ids) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/api/comparisons`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ ids }),
    });
    return res.ok;
  } catch (err) { console.error('deleteComparisons error:', err); return false; }
}

export async function archiveHistory(ids) {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/api/history/archive`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ ids }),
    });
    return res.ok;
  } catch (err) { return false; }
}

// FIX: Added comparison_result parameter — the old version only saved device
// names and never sent the AI text, so the app always showed "No result saved".
export async function saveComparison(device1, device2, comparisonResult = '') {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/api/comparisons`, {
      method: 'POST', headers,
      body: JSON.stringify({
        device1_name:      device1.name,
        device2_name:      device2.name,
        device1_id:        device1.id,
        device2_id:        device2.id,
        // FIX: send the AI comparison text so the app can display it
        comparison_result: comparisonResult || '',
      }),
    });
    return res.ok;
  } catch (err) { return false; }
}

export async function fetchComparisons() {
  try {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}/api/comparisons`, { headers });
    if (!res.ok) return [];
    return (await res.json()).comparisons || [];
  } catch (err) { return []; }
}