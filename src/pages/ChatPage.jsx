import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '@tensorflow/tfjs-backend-webgl';
import * as mobilenet from '@tensorflow-models/mobilenet';
import Navbar from '../components/Navbar';
import { askAIStream } from '../services/aiService';
import { saveChat } from '../services/historyService';

let cachedModel = null;

async function loadModel() {
  if (!cachedModel) {
    console.log('🧠 Loading MobileNet model...');
    cachedModel = await mobilenet.load({ version: 2, alpha: 1.0 });
    console.log('✅ MobileNet model loaded!');
  }
  return cachedModel;
}

async function classifyImage(imgElement) {
  const model = await loadModel();
  const predictions = await model.classify(imgElement, 15);
  return predictions
    .map(p => `${p.className} (${(p.probability * 100).toFixed(1)}%)`)
    .join(', ');
}

function renderMessage(content) {
  if (!content) return null;
  return content.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <strong key={i} style={{ display: 'block', marginBottom: '4px' }}>{line.slice(2, -2)}</strong>;
    }
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return <div key={i} style={{ paddingLeft: '12px', marginBottom: '2px' }}>• {line.slice(2)}</div>;
    }
    if (['🥇','🥈','🥉','✅','❌','⚠️','📱','📷','💡'].some(e => line.startsWith(e))) {
      return <div key={i} style={{ marginBottom: '4px' }}>{line}</div>;
    }
    if (line === '') return <div key={i} style={{ marginBottom: '8px' }} />;
    return <div key={i} style={{ whiteSpace: 'pre-wrap' }}>{line}</div>;
  });
}

function StreamingCursor() {
  return (
    <span style={{
      display: 'inline-block', width: '2px', height: '14px',
      background: 'var(--accent)', marginLeft: '2px', verticalAlign: 'middle',
      animation: 'blink 0.8s step-end infinite',
    }} />
  );
}

export default function ChatPage({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [modelStatus, setModelStatus] = useState('');
  const [pendingAutoSend, setPendingAutoSend] = useState(null);
  const messagesEndRef = useRef();
  const fileRef = useRef();
  const inputRef = useRef();
  const cancelStreamRef = useRef(null);
  const streamingMsgIdRef = useRef(null);
  const savedChatIdRef = useRef(null);

  // Preload TF model
  useEffect(() => {
    setModelStatus('⏳ Loading image AI model...');
    loadModel()
      .then(() => {
        setModelStatus('✅ Image AI ready');
        setTimeout(() => setModelStatus(''), 2500);
      })
      .catch(() => setModelStatus(''));
  }, []);

  // Load chat history or pending message
  useEffect(() => {
    const loadHistory = async () => {
      if (id) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/history`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          const historyItem = data.history?.find(h => h.id === parseInt(id));
          if (historyItem && historyItem.messages?.length) {
            savedChatIdRef.current = historyItem.id;
            setMessages(historyItem.messages.map(m => ({ ...m, id: Math.random() })));
            return;
          }
        } catch (err) {
          console.warn('Could not load history from API:', err);
        }
      }

      // Check for pending message
      const pending = sessionStorage.getItem('pendingMessage');
      if (pending) {
        sessionStorage.removeItem('pendingMessage');
        const { content } = JSON.parse(pending);
        if (content) {
          // Set welcome message first, then trigger auto-send
          setMessages([{
            id: 0,
            role: 'assistant',
            content: "👋 Hi! I'm SpecSmart AI, your specialized tech advisor for:\n• PC Components (CPU, GPU, RAM, Storage, Motherboards)\n• Smartphones\n• Keyboards & Mice\n\nAsk me anything about these topics, or upload a hardware image for identification!",
          }]);
          setPendingAutoSend(content);
          return;
        }
      }

      setMessages([{
        id: 0,
        role: 'assistant',
        content: "👋 Hi! I'm SpecSmart AI, your specialized tech advisor for:\n• PC Components (CPU, GPU, RAM, Storage, Motherboards)\n• Smartphones\n• Keyboards & Mice\n\nAsk me anything about these topics, or upload a hardware image for identification!",
      }]);
    };

    loadHistory();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (cancelStreamRef.current) cancelStreamRef.current();
    };
  }, []);

  const sendMessage = useCallback(
    async (messageContent, imageData) => {
      const textContent = messageContent || input;
      if (!textContent && !imageData) return;

      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: textContent,
        image: imageData,
      };

      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setUploadedFile(null);
      setUploadedPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      setIsLoading(true);

      try {
        let apiMessages;

        if (imageData) {
          setModelStatus('🔍 Analyzing image with TensorFlow.js...');
          const imgEl = new Image();
          imgEl.src = `data:image/jpeg;base64,${imageData}`;
          await new Promise((res, rej) => { imgEl.onload = res; imgEl.onerror = rej; });

          let concepts = '';
          try {
            concepts = await classifyImage(imgEl);
          } catch {
            concepts = 'electronic device, hardware component, circuit board, computer part';
          }
          setModelStatus('');

          const userQuery = textContent || 'Identify this hardware component and provide its full specifications.';
          apiMessages = [{
            role: 'user',
            content: `A hardware image was analyzed by TensorFlow.js MobileNet and detected: [${concepts}].

Based on these labels, ${userQuery}

Please:
1. Identify what PC hardware component or tech device this likely is
2. Provide typical specifications
3. Give approximate Philippine Peso price range
4. Suggest common use cases
5. If not a tech component, say so politely`,
          }];
        } else {
          apiMessages = [
            ...messages.filter(m => !(m.role === 'assistant' && m.id === 0)),
            userMessage,
          ].map(m => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
          }));
        }

        const streamingId = Date.now() + 1;
        streamingMsgIdRef.current = streamingId;

        setMessages(prev => [...prev, { id: streamingId, role: 'assistant', content: '', streaming: true }]);
        setIsLoading(false);
        setIsStreaming(true);

        cancelStreamRef.current = await askAIStream(
          apiMessages,

          // onToken
          token => {
            setMessages(prev =>
              prev.map(msg => msg.id === streamingId ? { ...msg, content: msg.content + token } : msg)
            );
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          },

          // onDone — save to DB
          () => {
            setMessages(prev => {
              const updated = prev.map(msg =>
                msg.id === streamingId ? { ...msg, streaming: false } : msg
              );

              const allMessages = updated.filter(m => m.role && m.content && m.id !== 0);
              if (allMessages.length >= 2) {
                const firstUserMsg = allMessages.find(m => m.role === 'user');
                const title = firstUserMsg ? firstUserMsg.content.slice(0, 60) : 'Chat Session';
                const cleanMessages = allMessages.map(m => ({ role: m.role, content: m.content }));
                saveChat(title, cleanMessages, savedChatIdRef.current).then(saved => {
                  if (saved?.id) savedChatIdRef.current = saved.id;
                });
              }

              return updated;
            });

            setIsStreaming(false);
            cancelStreamRef.current = null;
            console.log('✅ Streaming complete');
          },

          // onError
          err => {
            console.error('Stream error:', err);
            setModelStatus('');
            setMessages(prev =>
              prev.map(msg =>
                msg.id === streamingId
                  ? { ...msg, content: err.message || '⚠️ Something went wrong.', streaming: false }
                  : msg
              )
            );
            setIsStreaming(false);
            cancelStreamRef.current = null;
          }
        );
      } catch (err) {
        console.error('Chat error:', err);
        setModelStatus('');
        setIsLoading(false);
        setIsStreaming(false);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: err.message || '⚠️ Something went wrong.',
        }]);
      }
    },
    [input, messages]
  );

  // Auto-send pending message once sendMessage is ready
  useEffect(() => {
    if (pendingAutoSend && messages.length > 0) {
      const timer = setTimeout(() => {
        sendMessage(pendingAutoSend);
        setPendingAutoSend(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pendingAutoSend, messages, sendMessage]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!input.trim() && !uploadedFile) return;
    if (isLoading || isStreaming) return;

    if (uploadedFile) {
      const reader = new FileReader();
      reader.onload = async ev => {
        const base64 = ev.target.result.split(',')[1];
        await sendMessage(input || 'Identify this hardware component and provide its full specifications.', base64);
      };
      reader.readAsDataURL(uploadedFile);
    } else {
      await sendMessage(input);
    }
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadedPreview(URL.createObjectURL(file));
  };

  const handleStopStream = () => {
    if (cancelStreamRef.current) {
      cancelStreamRef.current();
      cancelStreamRef.current = null;
    }
    setMessages(prev => prev.map(msg => msg.streaming ? { ...msg, streaming: false } : msg));
    setIsStreaming(false);
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <Navbar onLogout={onLogout} />

      {/* Top bar */}
      <div style={{ padding: '12px 24px 0', maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '13px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>

        {modelStatus && (
          <span style={{ fontSize: '12px', color: 'var(--text-3)', fontStyle: 'italic' }}>{modelStatus}</span>
        )}

        {isStreaming && (
          <span style={{ fontSize: '12px', color: 'var(--accent)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'blink 1s ease infinite' }} />
            SpecSmart is typing...
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 160px' }}>
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}>
              <div className={`message-avatar ${msg.role === 'user' ? 'user-av' : 'ai'}`}>
                {msg.role === 'user' ? 'AM' : 'SS'}
              </div>
              <div className="message-bubble">
                {msg.image && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>📎 Hardware Image</div>
                    <img src={`data:image/jpeg;base64,${msg.image}`} alt="Uploaded hardware"
                      style={{ maxWidth: '200px', borderRadius: '8px', display: 'block' }} />
                  </div>
                )}
                <div style={{ lineHeight: '1.6', fontSize: '14px' }}>
                  {msg.content === '' && msg.streaming ? (
                    <StreamingCursor />
                  ) : (
                    <>
                      {renderMessage(msg.content)}
                      {msg.streaming && <StreamingCursor />}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message ai">
              <div className="message-avatar ai">SS</div>
              <div className="message-bubble">
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="chat-wrapper">
        <div style={{ width: '100%', maxWidth: '760px' }}>
          {uploadedPreview && (
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={uploadedPreview} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{uploadedFile?.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Ready to analyze with TensorFlow.js</div>
              </div>
              <button onClick={() => { setUploadedFile(null); setUploadedPreview(null); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          <form className="chat-bar" onSubmit={handleSubmit} style={{ borderRadius: 'var(--radius)' }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <button type="button" className="upload-btn" onClick={() => fileRef.current.click()} title="Upload hardware image">
              {uploadedFile ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
            </button>

            <input ref={inputRef} className="chat-input" type="text"
              placeholder="Ask about CPUs, GPUs, phones, keyboards, mice... or upload a hardware image"
              value={input} onChange={e => setInput(e.target.value)}
              disabled={isLoading || isStreaming} />

            {isStreaming ? (
              <button type="button" className="chat-send" onClick={handleStopStream}
                title="Stop generating" style={{ background: 'var(--text-3)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </button>
            ) : (
              <button type="submit" className="chat-send" disabled={isLoading}>
                {isLoading ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                    <path d="M22 12a10 10 0 0 1-10 10" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}