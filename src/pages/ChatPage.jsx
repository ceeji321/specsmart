import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { historyData } from '../data/history';
import { askAI } from '../services/aiService';

function renderMessage(content) {
  // Simple markdown-like rendering
  return content
    .split('\n')
    .map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={i} style={{ display: 'block', marginBottom: '4px' }}>{line.slice(2, -2)}</strong>;
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return <div key={i} style={{ paddingLeft: '12px', marginBottom: '2px' }}>• {line.slice(2)}</div>;
      }
      if (line.startsWith('🥇') || line.startsWith('🥈') || line.startsWith('🥉') || line.startsWith('✅') || line.startsWith('❌') || line.startsWith('⚠️') || line.startsWith('📱') || line.startsWith('📷') || line.startsWith('💡')) {
        return <div key={i} style={{ marginBottom: '4px' }}>{line}</div>;
      }
      if (line === '') return <div key={i} style={{ marginBottom: '8px' }} />;
      return <div key={i}>{line}</div>;
    });
}

export default function ChatPage({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const messagesEndRef = useRef();
  const fileRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    // Load existing history or start new chat
    const historyItem = historyData.find(h => h.id === parseInt(id));
    if (historyItem) {
      setMessages(historyItem.messages.map(m => ({ ...m, id: Math.random() })));
    } else {
      // New chat — check for pending message
      const pending = sessionStorage.getItem('pendingMessage');
      if (pending) {
        sessionStorage.removeItem('pendingMessage');
        const { content, file } = JSON.parse(pending);
        if (content) {
          setTimeout(() => sendMessage(content), 100);
        }
      } else {
        // Default welcome
        setMessages([{
          id: 0,
          role: 'assistant',
          content: '👋 Hi! I\'m SpecSmart AI, your specialized tech advisor for:\n• PC Components (CPU, GPU, RAM, Storage, Motherboards)\n• Smartphones\n• Keyboards & Mice\n\nAsk me anything about these topics, or upload a hardware image for identification!'
        }]);
      }
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageContent, imageData) => {
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageContent || input,
      image: imageData
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedFile(null);
    setUploadedPreview(null);
    setIsLoading(true);

    try {
      const apiMessages = [...messages.filter(m => m.role !== 'assistant' || m.id !== 0), userMessage]
        .map(m => ({
          role: m.role,
          content: m.image
            ? [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: m.image } }, { type: 'text', text: m.content || 'What hardware is in this image? Identify it and provide full specs.' }]
            : m.content
        }));

      const response = await askAI(apiMessages);

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: response
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: '⚠️ Sorry, I couldn\'t connect to the AI service right now. Please check that your API key is configured in the backend .env file (`ANTHROPIC_API_KEY`).'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() && !uploadedFile) return;

    if (uploadedFile) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1];
        await sendMessage(input || 'Identify this hardware component and provide its full specifications.', base64);
      };
      reader.readAsDataURL(uploadedFile);
    } else {
      await sendMessage(input);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadedPreview(url);
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar onLogout={onLogout} />

      {/* Back button */}
      <div style={{ padding: '12px 24px 0', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost"
          style={{ padding: '6px 14px', fontSize: '13px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 160px' }}>
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}>
              <div className={`message-avatar ${msg.role === 'user' ? 'user-av' : 'ai'}`}>
                {msg.role === 'user' ? 'AM' : 'SS'}
              </div>
              <div className="message-bubble">
                {msg.image && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>📎 Hardware Image</div>
                    <img
                      src={`data:image/jpeg;base64,${msg.image}`}
                      alt="Uploaded hardware"
                      style={{ maxWidth: '200px', borderRadius: '8px', display: 'block' }}
                    />
                  </div>
                )}
                <div style={{ lineHeight: '1.6', fontSize: '14px' }}>
                  {renderMessage(msg.content)}
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
          {/* Image preview */}
          {uploadedPreview && (
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={uploadedPreview} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)' }}>{uploadedFile?.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Ready to analyze</div>
              </div>
              <button onClick={() => { setUploadedFile(null); setUploadedPreview(null); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          <form className="chat-bar" onSubmit={handleSubmit} style={{ borderRadius: 'var(--radius)' }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <button type="button" className="upload-btn" onClick={() => fileRef.current.click()} title="Upload hardware image for AI identification">
              {uploadedFile ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              )}
            </button>

            <input
              ref={inputRef}
              className="chat-input"
              type="text"
              placeholder="Ask about CPUs, GPUs, phones, keyboards, mice... or upload a hardware image"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
            />

            <button type="submit" className="chat-send" disabled={isLoading}>
              {isLoading ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
                  <path d="M22 12a10 10 0 0 1-10 10"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}