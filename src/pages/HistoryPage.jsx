import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { historyData } from '../data/history';

export default function HistoryPage() {
  const [items, setItems] = useState(historyData);
  const [selected, setSelected] = useState(new Set());
  const navigate = useNavigate();

  const { today, yesterday, last7 } = (() => {
    const t = items.filter(h => h.date === 'today');
    const y = items.filter(h => h.date === 'yesterday');
    const l = items.filter(h => h.date === 'last7days');
    return { today: t, yesterday: y, last7: l };
  })();

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

  const deleteSelected = () => {
    setItems(prev => prev.filter(i => !selected.has(i.id)));
    setSelected(new Set());
  };

  const archiveSelected = () => {
    setItems(prev => prev.map(i => selected.has(i.id) ? { ...i, archived: true } : i));
    setSelected(new Set());
  };

  const renderSection = (label, sectionItems) => {
    if (sectionItems.length === 0) return null;
    return (
      <div className="history-section" key={label}>
        <div className="history-section-label">{label}</div>
        {sectionItems.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => toggle(item.id)}
              onClick={e => e.stopPropagation()}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
            />
            <div
              className="history-item"
              style={{ flex: 1, cursor: 'pointer' }}
              onClick={() => navigate(`/chat/${item.id}`)}
            >
              <span className="history-item-time">{item.time}</span>
              <span className="history-item-title">{item.title}</span>
              {item.archived && (
                <span style={{ fontSize: '11px', color: 'var(--text-3)', background: 'var(--bg-3)', padding: '2px 8px', borderRadius: '50px', flexShrink: 0 }}>Archived</span>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page">
      <Navbar />

      <div className="page-content" style={{ maxWidth: '720px' }}>
        <div className="section-heading">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Chat History
        </div>

        {/* Actions bar */}
        <div className="history-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="checkbox"
              checked={selected.size === items.length && items.length > 0}
              onChange={toggleAll}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              {selected.size === 0 ? 'None selected' : `${selected.size} selected`}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {selected.size > 0 && (
              <>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '7px 14px', fontSize: '13px' }}
                  onClick={archiveSelected}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                  </svg>
                  Archive
                </button>
                <button
                  className="btn btn-danger"
                  style={{ padding: '7px 14px', fontSize: '13px' }}
                  onClick={deleteSelected}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* History items */}
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <div style={{ fontFamily: 'Syne', fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-2)' }}>No chat history</div>
            <div style={{ fontSize: '14px' }}>Start a conversation with SpecSmart AI</div>
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