// src/pages/DeletedHistory.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { Trash2, Search, Crown, User, RefreshCw, ArrowLeft } from 'lucide-react';

const Avatar = ({ name, size = 34 }) => {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = (name || '').charCodeAt(0) * 7 % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: `linear-gradient(135deg, hsl(${hue},60%,50%), hsl(${hue+40},70%,40%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.35, color: 'white', flexShrink: 0 }}>
      {initials}
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const color = role === 'admin' ? '#f87171' : '#9aa0b0';
  const bg = role === 'admin' ? 'rgba(248,113,113,0.1)' : 'rgba(154,160,176,0.08)';
  const border = role === 'admin' ? 'rgba(248,113,113,0.25)' : 'rgba(154,160,176,0.2)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 50, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color, background: bg, border: `1px solid ${border}` }}>
      {role === 'admin' ? <Crown size={9} /> : <User size={9} />}{role}
    </span>
  );
};

export default function DeletedHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { if (user?.role !== 'admin') navigate('/dashboard'); }, [user]);

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/manager/deleted-users');
      setRecords(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDeleted(); }, []);

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–';

  const filtered = records.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 1100 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <button onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13, marginBottom: 12, padding: 0 }}>
              <ArrowLeft size={14} /> Back to Admin Panel
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                <Trash2 size={18} />
              </div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, margin: 0 }}>Deleted History</h1>
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>
              Log of all users permanently deleted by admins. Total: <strong style={{ color: 'var(--text)' }}>{records.length}</strong>
            </p>
          </div>
          <button onClick={fetchDeleted} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', padding: '8px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="search-wrapper" style={{ maxWidth: 320 }}>
              <Search size={15} className="search-icon" />
              <input className="search-input" placeholder="Search deleted users…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '9px 16px 9px 38px', borderRadius: 10 }} />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Email', 'Role', 'Deleted At', 'Deleted By'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)' }}>Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
                    {search ? 'No results found' : 'No deleted users yet'}
                  </td></tr>
                ) : filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={r.name} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{r.name || '–'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-2)' }}>{r.email}</td>
                    <td style={{ padding: '14px 20px' }}><RoleBadge role={r.role || 'user'} /></td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{fmt(r.deleted_at)}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-2)' }}>{r.deleted_by_email || '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ height: 48 }} />
      </div>
    </div>
  );
}