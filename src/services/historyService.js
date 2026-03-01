// src/services/historyService.js
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://specsmart-production.up.railway.app';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Fetch all chat history from DB
export async function fetchHistory() {
  try {
    const res = await fetch(`${API_BASE}/api/history`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch history');
    const data = await res.json();
    return data.history || [];
  } catch (err) {
    console.error('fetchHistory error:', err);
    return [];
  }
}

// Save or update a chat session in DB
// Pass chatId to update an existing session, omit to create new
export async function saveChat(title, messages, chatId = null) {
  try {
    const cleanMessages = messages
      .filter(m => m.role && m.content)
      .map(m => ({ role: m.role, content: m.content }));

    if (cleanMessages.length < 2) return null; // don't save empty chats

    const res = await fetch(`${API_BASE}/api/history`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        title: title.slice(0, 100),
        messages: cleanMessages,
        chatId,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.history;
  } catch (err) {
    console.error('saveChat error:', err);
    return null;
  }
}

// Delete multiple history items
export async function deleteHistory(ids) {
  try {
    const res = await fetch(`${API_BASE}/api/history`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ ids }),
    });
    return res.ok;
  } catch (err) {
    console.error('deleteHistory error:', err);
    return false;
  }
}

// Archive multiple history items
export async function archiveHistory(ids) {
  try {
    const res = await fetch(`${API_BASE}/api/history/archive`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ ids }),
    });
    return res.ok;
  } catch (err) {
    console.error('archiveHistory error:', err);
    return false;
  }
}

// Save a comparison to DB
export async function saveComparison(device1, device2) {
  try {
    const res = await fetch(`${API_BASE}/api/comparisons`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        device1_name: device1.name,
        device2_name: device2.name,
        device1_id: device1.id,
        device2_id: device2.id,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('saveComparison error:', err);
    return false;
  }
}

// Fetch comparisons (for history page)
export async function fetchComparisons() {
  try {
    const res = await fetch(`${API_BASE}/api/comparisons`, { headers: getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.comparisons || [];
  } catch (err) {
    console.error('fetchComparisons error:', err);
    return [];
  }
}