// Automatically uses localhost in dev, Railway in production
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://specsmart-production.up.railway.app';

// ─── Streaming AI call ────────────────────────────────────────────────────────
// onToken(token)  → called for each streamed word/token
// onDone()        → called when stream finishes
// onError(err)    → called on failure
// Returns a cancel function
export async function askAIStream(messages, onToken, onDone, onError) {
  try {
    const token = localStorage.getItem('token');

    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }));

    console.log('🤖 Starting stream from AI API...');

    const response = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        messages: formattedMessages,
        stream: true,
      }),
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

    // Read the stream asynchronously
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep last incomplete line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed === 'data: [DONE]') {
              onDone?.();
              return;
            }

            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                if (json.token) {
                  onToken(json.token);
                }
                if (json.error) {
                  onError?.(new Error(json.error));
                  return;
                }
              } catch (e) {
                // skip malformed chunks
              }
            }
          }
        }
        if (!cancelled) onDone?.();
      } catch (err) {
        if (!cancelled) {
          console.error('❌ Stream read error:', err);
          onError?.(err);
        }
      }
    })();

    return cancel;
  } catch (error) {
    console.error('❌ AI Stream Error:', error);

    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      onError?.(
        new Error(
          `Cannot connect to server at ${API_BASE}. Make sure your backend is running.`
        )
      );
    } else {
      onError?.(error);
    }

    return () => {};
  }
}

// ─── Non-streaming fallback ───────────────────────────────────────────────────
export async function askAI(messages) {
  try {
    const token = localStorage.getItem('token');

    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
    }));

    console.log('🤖 Sending to AI API (non-streaming)...');

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
    console.log('✅ AI Response received:', data);
    return data.content;
  } catch (error) {
    console.error('❌ AI Service Error:', error);

    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error(`Cannot connect to server at ${API_BASE}. Make sure the backend is running.`);
    }
    if (error.message.includes('Rate limit exceeded')) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    throw error;
  }
}

// ─── Image analysis (non-streaming) ──────────────────────────────────────────
export async function analyzeImage(base64Image, mimeType = 'image/jpeg') {
  try {
    const token = localStorage.getItem('token');

    console.log('📸 Sending image to AI for analysis...');

    const response = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ base64Image, mimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Image analysis failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Image analysis received:', data);
    return data.content;
  } catch (error) {
    console.error('❌ Image Analysis Error:', error);

    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Cannot connect to server. Make sure the backend is running.');
    }
    throw error;
  }
}

export default { askAI, askAIStream, analyzeImage };