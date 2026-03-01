// src/pages/HistoryPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { fetchHistory, fetchComparisons, archiveHistory } from '../services/historyService';

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/'); return; }

    async function load() {
      setLoading(true);
      const [chats, comparisons] = await Promise.all([fetchHistory(), fetchComparisons()]);
      const merged = [...chats, ...comparisons].sort((a, b) => {
        const order = { today: 0, yesterday: 1, last7days: 2 };
        return (order[a.date] ?? 3) - (order[b.date] ?? 3);
      });
      setItems(merged);
      setLoading(false);
    }
    load();
  }, [isAuthenticated, authLoading, navigate]);

  const today     = items.filter(h => h.date === 'today');
  const yesterday = items.filter(h => h.date === 'yesterday');
  const last7     = items.filter(h => h.date === 'last7days');

  const toggle = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  };

  const archiveSelected = async () => {
    const ids = [...selected];
    const chatIds = ids.filter(id => !items.find(i => i.id === id)?.type);
    if (chatIds.length) await archiveHistory(chatIds);
    setItems(prev => prev.filter(i => !selected.has(i.id)));
    setSelected(new Set());
  };

  const renderSection = (label, sectionItems) => {
    if (sectionItems.length === 0) return null;
    return (
      <div className="history-section" key={label}>
        <div className="history-section-label">{label}</div>
        {sectionItems.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)}
              onClick={e => e.stopPropagation()}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} />
            <div className="history-item" style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => {
                if (item.type === 'comparison') navigate('/compare');
                else navigate(`/chat/${item.id}`);
              }}>
              <span className="history-item-time">{item.time}</span>
              <span className="history-item-title">{item.title}</span>
              {item.type === 'comparison' && (
                <span style={{ fontSize: 11, color: 'var(--accent)', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 50, flexShrink: 0 }}>
                  ⚖️ Compare
                </span>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ color: 'var(--text-3)', flexShrink: 0 }}>
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (authLoading) return <div className="page"><Navbar /></div>;

  return (
    <div className="page">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 720 }}>
        <div className="section-heading">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Chat History
        </div>

        <div className="history-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox"
              checked={selected.size === items.length && items.length > 0}
              onChange={toggleAll}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {selected.size === 0 ? 'None selected' : `${selected.size} selected`}
            </span>
          </div>
          {selected.size > 0 && (
            <button className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: 13 }} onClick={archiveSelected}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
                <line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
              Archive
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 14 }}>Loading history...</div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-2)' }}>No chat history</div>
            <div style={{ fontSize: 14 }}>Start a conversation with SpecSmart AI</div>
          </div>
        ) : (
          <>
            {renderSection('Today', today)}
            {renderSection('Yesterday', yesterday)}
            {renderSection('Last 7 Days', last7)}
          </>
        )}
      </div>
    </div>
  );
}