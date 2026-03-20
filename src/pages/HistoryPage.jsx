// src/pages/HistoryPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { fetchHistory, fetchComparisons, deleteHistory, deleteComparisons } from '../services/historyService';

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
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

  const deleteSelected = async () => {
    if (deleting) return;
    setDeleting(true);

    const ids = [...selected];

    const chatIds = ids.filter(id => {
      const item = items.find(i => i.id === id);
      return !item?.type || item.type !== 'comparison';
    });
    const comparisonIds = ids.filter(id => {
      const item = items.find(i => i.id === id);
      return item?.type === 'comparison';
    });

    const promises = [];
    if (chatIds.length > 0) promises.push(deleteHistory(chatIds));
    if (comparisonIds.length > 0) promises.push(deleteComparisons(comparisonIds));

    await Promise.all(promises);

    setItems(prev => prev.filter(i => !selected.has(i.id)));
    setSelected(new Set());
    setDeleting(false);
  };

  const renderSection = (label, sectionItems) => {
    if (sectionItems.length === 0) return null;
    return (
      <div className="history-section" key={label}>
        <div className="history-section-label">{label}</div>
        {sectionItems.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => toggle(item.id)}
              onClick={e => e.stopPropagation()}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
            />
            <div
              className="history-item"
              style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
              onClick={() => {
                if (item.type === 'comparison') {
                  const parts = item.title.split(' vs ');
                  const d1 = encodeURIComponent(parts[0] || '');
                  const d2 = encodeURIComponent(parts[1] || '');
                  navigate(`/compare?d1=${d1}&d2=${d2}`);
                } else {
                  navigate(`/chat/${item.id}`);
                }
              }}
            >
              {/* Thumbnail: scanned image or placeholder icon */}
              {item.hasImage && item.imageThumb ? (
                <img
                  src={`data:${item.imageMime || 'image/jpeg'};base64,${item.imageThumb}`}
                  alt="Hardware"
                  style={{
                    width: 36, height: 36, objectFit: 'cover',
                    borderRadius: 6, flexShrink: 0,
                    border: '1px solid var(--border)',
                  }}
                />
              ) : (
                <div style={{
                  width: 36, height: 36, flexShrink: 0,
                  borderRadius: 6, background: 'var(--bg-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {item.type === 'comparison' ? '⚖️' : '💬'}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="history-item-time">{item.time}</span>
                  {item.type === 'comparison' && (
                    <span style={{
                      fontSize: 11, color: 'var(--accent)',
                      background: 'rgba(99,102,241,0.1)',
                      padding: '2px 8px', borderRadius: 50, flexShrink: 0,
                    }}>
                      ⚖️ Compare
                    </span>
                  )}
                </div>
                <span className="history-item-title" style={{
                  display: 'block', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.title}
                </span>
              </div>

              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2"
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
            <input
              type="checkbox"
              checked={selected.size === items.length && items.length > 0}
              onChange={toggleAll}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
              {selected.size === 0 ? 'None selected' : `${selected.size} selected`}
            </span>
          </div>

          {selected.size > 0 && (
            <button
              className="btn btn-ghost"
              style={{
                padding: '7px 14px', fontSize: 13,
                color: '#ef4444',
                opacity: deleting ? 0.6 : 1,
                cursor: deleting ? 'not-allowed' : 'pointer',
              }}
              onClick={deleteSelected}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
                    <path d="M22 12a10 10 0 0 1-10 10"/>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4h6v2"/>
                  </svg>
                  Delete ({selected.size})
                </>
              )}
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
            <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-2)' }}>
              No chat history
            </div>
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

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}