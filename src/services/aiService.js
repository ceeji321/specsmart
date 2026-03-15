const API_BASE = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://specsmart-production.up.railway.app';

// ─── Streaming chat ────────────────────────────────────────────────────────────
export async function askAIStream(messages, onToken, onDone, onError) {
  try {
    const token = localStorage.getItem('token');
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }));

    const response = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ messages: formattedMessages, stream: true }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let cancelled = false;

    const cancel = () => {
      cancelled = true;
      reader.cancel().catch(() => {});
    };

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed === 'data: [DONE]') { onDone?.(); return; }
            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                if (json.token) onToken(json.token);
                if (json.error) { onError?.(new Error(json.error)); return; }
              } catch (e) { /* skip malformed */ }
            }
          }
        }
        if (!cancelled) onDone?.();
      } catch (err) {
        if (!cancelled) onError?.(err);
      }
    })();

    return cancel;
  } catch (error) {
    console.error('AI Stream Error:', error);
    onError?.(error);
    return () => {};
  }
}

// ─── Non-streaming chat ────────────────────────────────────────────────────────
export async function askAI(messages) {
  const token = localStorage.getItem('token');
  const formattedMessages = messages.map(msg => ({
    role: msg.role,
    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
  }));

  const response = await fetch(`${API_BASE}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ messages: formattedMessages }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.content;
}

// ─── Image analysis with Groq Vision ─────────────────────────────────────────
export async function analyzeImageWithGroq(base64Image, mimeType = 'image/jpeg', userQuery = '') {
  const token = localStorage.getItem('token');
  console.log('Sending image to Groq Vision...');

  const response = await fetch(`${API_BASE}/api/ai/analyze-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ base64Image, mimeType, userQuery }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Image analysis failed with status ${response.status}`);
  }

  const data = await response.json();
  console.log('Groq Vision result:', data.displayName, '| Source:', data.notes?.includes('Spec DB') ? 'Spec DB ✅' : 'AI');
  return data;
}

// ─── Simple image analysis (returns text) ─────────────────────────────────────
export async function analyzeImage(base64Image, mimeType = 'image/jpeg') {
  const result = await analyzeImageWithGroq(base64Image, mimeType);
  return result.fullSpecs || result.message || 'Could not analyze image.';
}

// ─── Fetch spec DB device list from backend ────────────────────────────────────
export async function fetchSpecDB() {
  try {
    const response = await fetch(`${API_BASE}/api/ai/spec-db`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export default { askAI, askAIStream, analyzeImage, analyzeImageWithGroq, fetchSpecDB };