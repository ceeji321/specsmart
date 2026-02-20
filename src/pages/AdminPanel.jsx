import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import {
  Users, Shield, Search, Trash2, Edit2,
  ChevronLeft, ChevronRight, X, Check, AlertTriangle,
  RefreshCw, UserPlus, Key, MoreVertical, Crown, User, Archive
} from 'lucide-react';

const API_URL = 'https://specsmart-production.up.railway.app';

const roleColor = (role) => {
  if (role === 'admin') return { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' };
  return { color: '#9aa0b0', bg: 'rgba(154,160,176,0.08)', border: 'rgba(154,160,176,0.2)' };
};

const RoleBadge = ({ role }) => {
  const c = roleColor(role);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 50, fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      {role === 'admin' ? <Crown size={10} /> : <User size={10} />}{role}
    </span>
  );
};

const Avatar = ({ name, size = 36 }) => {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = (name || '').charCodeAt(0) * 7 % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: `linear-gradient(135deg, hsl(${hue},60%,50%), hsl(${hue + 40},70%,40%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: size * 0.35, color: 'white', flexShrink: 0 }}>
      {initials}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, accent }) => (
  <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 18, transition: 'border-color 0.2s' }}
    onMouseEnter={e => e.currentTarget.style.borderColor = accent || 'var(--accent)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
  >
    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${accent || 'var(--accent)'}18`, border: `1px solid ${accent || 'var(--accent)'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent || 'var(--accent)', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 26, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value ?? '–'}</div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: accent || 'var(--accent)', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const EditModal = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name || '');
  const [role, setRole] = useState(user.role || 'user');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const handleSave = async () => {
    setSaving(true); setErr('');
    try { const res = await axios.put(`${API_URL}/api/manager/users/${user.id}`, { name, role }); onSave(res.data.data); onClose(); }
    catch (e) { setErr(e.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={18} /></button>
        <div className="modal-title" style={{ fontSize: 18 }}>Edit User</div>
        <p className="modal-sub">{user.email}</p>
        <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-input" value={role} onChange={e => setRole(e.target.value)} style={{ cursor: 'pointer' }}>
            <option value="user">User</option><option value="admin">Admin</option>
          </select>
        </div>
        {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving…' : <><Check size={14} /> Save</>}</button>
        </div>
      </div>
    </div>
  );
};

const ResetPwModal = ({ user, onClose }) => {
  const [pw, setPw] = useState(''); const [done, setDone] = useState(false); const [saving, setSaving] = useState(false); const [err, setErr] = useState('');
  const handleReset = async () => {
    if (pw.length < 6) { setErr('Minimum 6 characters'); return; }
    setSaving(true); setErr('');
    try { await axios.post(`${API_URL}/api/manager/users/${user.id}/reset-password`, { new_password: pw }); setDone(true); }
    catch (e) { setErr(e.response?.data?.message || 'Reset failed'); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={18} /></button>
        <div className="modal-title" style={{ fontSize: 18 }}>Reset Password</div>
        <p className="modal-sub">{user.email}</p>
        {done ? <div style={{ padding: 16, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, color: 'var(--green)', textAlign: 'center' }}>✓ Password reset successfully</div> : (
          <><div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" placeholder="Min. 6 characters" value={pw} onChange={e => setPw(e.target.value)} /></div>
          {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10 }}><button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button><button className="btn btn-primary" onClick={handleReset} disabled={saving} style={{ flex: 1 }}>{saving ? 'Resetting…' : <><Key size={14} /> Reset</>}</button></div></>
        )}
      </div>
    </div>
  );
};

const DeleteModal = ({ user, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false); const [err, setErr] = useState('');
  const handleDelete = async () => {
    setLoading(true); setErr('');
    try { await axios.delete(`${API_URL}/api/manager/users/${user.id}`); onDeleted(user.id); onClose(); }
    catch (e) { setErr(e.response?.data?.message || 'Delete failed'); setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)', marginBottom: 16 }}><AlertTriangle size={22} /></div>
        <div className="modal-title" style={{ fontSize: 18 }}>Delete User?</div>
        <p className="modal-sub">Permanently delete <strong style={{ color: 'var(--text)' }}>{user.name}</strong> ({user.email}). Cannot be undone.</p>
        {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={loading} style={{ flex: 1 }}>{loading ? 'Deleting…' : <><Trash2 size={14} /> Delete</>}</button>
        </div>
      </div>
    </div>
  );
};

const ArchiveModal = ({ user, onClose, onArchived }) => {
  const [reason, setReason] = useState(''); const [loading, setLoading] = useState(false); const [err, setErr] = useState('');
  const handleArchive = async () => {
    setLoading(true); setErr('');
    try { await axios.post(`${API_URL}/api/manager/users/${user.id}/archive`, { reason }); onArchived(user.id); onClose(); }
    catch (e) { setErr(e.response?.data?.message || 'Archive failed'); setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', marginBottom: 16 }}><Archive size={22} /></div>
        <div className="modal-title" style={{ fontSize: 18 }}>Archive User?</div>
        <p className="modal-sub"><strong style={{ color: 'var(--text)' }}>{user.name}</strong> will be hidden from the active list but their record is kept.</p>
        <div className="form-group"><label className="form-label">Reason (optional)</label><input className="form-input" placeholder="e.g. Inactive account" value={reason} onChange={e => setReason(e.target.value)} /></div>
        {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleArchive} disabled={loading} style={{ flex: 1, padding: '9px 16px', borderRadius: 8, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{loading ? 'Archiving…' : <><Archive size={14} /> Archive</>}</button>
        </div>
      </div>
    </div>
  );
};

const CreateModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'admin' });
  const [saving, setSaving] = useState(false); const [err, setErr] = useState('');
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleCreate = async () => {
    if (!form.email || !form.name || !form.password) { setErr('All fields are required'); return; }
    setSaving(true); setErr('');
    try { const res = await axios.post(`${API_URL}/api/manager/users`, form); onCreated(res.data.data); onClose(); }
    catch (e) { setErr(e.response?.data?.message || 'Create failed'); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}><X size={18} /></button>
        <div className="modal-title" style={{ fontSize: 18 }}>Create Admin</div>
        <p className="modal-sub">Add a new admin to SpecSmart</p>
        {['name', 'email', 'password'].map(k => (
          <div className="form-group" key={k}>
            <label className="form-label">{k.charAt(0).toUpperCase() + k.slice(1)}</label>
            <input className="form-input" type={k === 'password' ? 'password' : 'text'} placeholder={k === 'password' ? 'Min. 6 characters' : ''} value={form[k]} onChange={e => update(k, e.target.value)} />
          </div>
        ))}
        <div className="form-group">
          <label className="form-label">Role</label>
          <div className="form-input" style={{ color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}><Crown size={14} style={{ color: '#f87171' }} /> Admin</div>
        </div>
        {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={saving} style={{ flex: 1 }}>{saving ? 'Creating…' : <><UserPlus size={14} /> Create</>}</button>
        </div>
      </div>
    </div>
  );
};

const RowActions = ({ user, onEdit, onResetPw, onDelete, onArchive, currentId }) => {
  const [open, setOpen] = useState(false);
  const isSelf = String(user.id) === String(currentId);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: '1px solid transparent', color: 'var(--text-3)', cursor: 'pointer', padding: '5px 7px', borderRadius: 8, transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; } }}
      ><MoreVertical size={16} /></button>
      {open && (<>
        <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 99, background: 'var(--bg-2)', border: '1px solid var(--border-light)', borderRadius: 10, minWidth: 160, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <button className="dropdown-item" onClick={() => { onEdit(); setOpen(false); }}><Edit2 size={14} /> Edit</button>
          <button className="dropdown-item" onClick={() => { onResetPw(); setOpen(false); }}><Key size={14} /> Reset Password</button>
          {!isSelf && (<>
            <div className="dropdown-divider" />
            <button className="dropdown-item" style={{ color: '#fbbf24' }} onClick={() => { onArchive(); setOpen(false); }}><Archive size={14} /> Archive</button>
            <button className="dropdown-item danger" onClick={() => { onDelete(); setOpen(false); }}><Trash2 size={14} /> Delete</button>
          </>)}
        </div>
      </>)}
    </div>
  );
};

const LiveBadge = ({ connected }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: connected ? 'rgba(74,222,128,0.08)' : 'rgba(154,160,176,0.08)', border: `1px solid ${connected ? 'rgba(74,222,128,0.25)' : 'rgba(154,160,176,0.2)'}`, fontSize: 11, fontWeight: 600, color: connected ? '#4ade80' : 'var(--text-3)' }}>
    <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#4ade80' : 'var(--text-3)', boxShadow: connected ? '0 0 6px #4ade80' : 'none', animation: connected ? 'livepulse 2s infinite' : 'none' }} />
    {connected ? 'Live' : 'Offline'}
  </div>
);

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [sseConnected, setSseConnected] = useState(false);
  const LIMIT = 10;

  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [archiveUser, setArchiveUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const sseRef = useRef(null);

  useEffect(() => { if (!isAdmin) navigate('/dashboard'); }, [isAdmin]);

  // SSE realtime
  useEffect(() => {
    if (!isAdmin) return;
    const connect = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const es = new EventSource(`${API_URL}/api/manager/stream?token=${token}`);
      sseRef.current = es;
      es.onopen = () => setSseConnected(true);
      es.onerror = () => { setSseConnected(false); es.close(); setTimeout(connect, 3000); };
      es.onmessage = (e) => {
        try {
          const { type, data } = JSON.parse(e.data);
          if (type === 'connected') return;
          if (type === 'user_created') {
            setUsers(prev => prev.find(u => u.id === data.id) ? prev : [data, ...prev]);
            setStats(s => s ? { ...s, total_users: +s.total_users + 1, regular_users: data.role === 'user' ? +s.regular_users + 1 : s.regular_users, admins: data.role === 'admin' ? +s.admins + 1 : s.admins } : s);
          }
          if (type === 'user_updated') setUsers(prev => prev.map(u => u.id === data.id ? data : u));
          if (type === 'user_deleted' || type === 'user_archived') {
            setUsers(prev => prev.filter(u => u.id !== data.id));
            setStats(s => s ? { ...s, total_users: Math.max(0, +s.total_users - 1) } : s);
          }
        } catch (_) {}
      };
    };
    connect();
    return () => { sseRef.current?.close(); setSseConnected(false); };
  }, [isAdmin]);

  const fetchStats = () => axios.get(`${API_URL}/api/manager/statistics`).then(r => setStats(r.data.data)).catch(() => {});

  useEffect(() => { fetchStats(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      const res = await axios.get(`${API_URL}/api/manager/users`, { params });
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); fetchUsers(); }, 400); return () => clearTimeout(t); }, [search]);

  const handleUserSaved = (u) => setUsers(us => us.map(x => x.id === u.id ? u : x));
  const handleUserDeleted = (id) => { setUsers(us => us.filter(u => u.id !== id)); setStats(s => s ? { ...s, total_users: Math.max(0, +s.total_users - 1) } : s); };
  const handleUserArchived = (id) => { setUsers(us => us.filter(u => u.id !== id)); setStats(s => s ? { ...s, total_users: Math.max(0, +s.total_users - 1) } : s); };
  const handleUserCreated = (u) => { setUsers(prev => prev.find(x => x.id === u.id) ? prev : [u, ...prev]); setStats(s => s ? { ...s, total_users: +s.total_users + 1 } : s); };
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';

  return (
    <div className="page">
      <style>{`@keyframes livepulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
      <Navbar />
      <div className="page-content" style={{ maxWidth: 1200 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}><Shield size={18} /></div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, margin: 0 }}>Admin Panel</h1>
              <RoleBadge role={user?.role} />
              <LiveBadge connected={sseConnected} />
            </div>
            <p style={{ color: 'var(--text-2)', fontSize: 14, margin: 0 }}>Manage users and monitor activity. New registrations appear instantly.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><UserPlus size={15} /> New Admin</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard icon={<Users size={20} />} label="Total Users" value={stats?.total_users} sub={`+${stats?.new_users_30d ?? 0} this month`} />
          <StatCard icon={<User size={20} />} label="Regular Users" value={stats?.regular_users} accent="var(--text-2)" />
          <StatCard icon={<Crown size={20} />} label="Admins" value={stats?.admins} accent="var(--red)" />
        </div>

        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div className="search-wrapper" style={{ maxWidth: 300, flex: 1 }}>
              <Search size={15} className="search-icon" />
              <input className="search-input" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '9px 16px 9px 38px', borderRadius: 10 }} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'user', 'admin'].map(r => (
                <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', background: roleFilter === r ? 'var(--accent-glow)' : 'var(--bg-3)', borderColor: roleFilter === r ? 'var(--accent)' : 'var(--border)', color: roleFilter === r ? 'var(--accent)' : 'var(--text-2)', fontFamily: 'DM Sans, sans-serif' }}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={() => { fetchUsers(); fetchStats(); }} style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', padding: '7px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
            ><RefreshCw size={15} /></button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Email', 'Role', 'Joined', 'Last Login', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)' }}>Loading…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-3)' }}>No users found</td></tr>
                ) : users.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={u.name} />
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                          {u.name}
                          {String(u.id) === String(user?.id) && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--accent)', background: 'var(--accent-glow)', padding: '1px 6px', borderRadius: 4 }}>You</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-2)' }}>{u.email}</td>
                    <td style={{ padding: '14px 20px' }}><RoleBadge role={u.role} /></td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{fmt(u.created_at)}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{fmt(u.last_login)}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <RowActions user={u} currentId={user?.id} onEdit={() => setEditUser(u)} onResetPw={() => setResetUser(u)} onDelete={() => setDeleteUser(u)} onArchive={() => setArchiveUser(u)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{pagination.total} users · Page {page} of {pagination.pages}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 10px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: page === 1 ? 'var(--text-3)' : 'var(--text)', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={15} /></button>
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} style={{ padding: '6px 10px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: page === pagination.pages ? 'var(--text-3)' : 'var(--text)', cursor: page === pagination.pages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight size={15} /></button>
              </div>
            </div>
          )}
        </div>
        <div style={{ height: 48 }} />
      </div>

      {editUser    && <EditModal    user={editUser}    onClose={() => setEditUser(null)}    onSave={handleUserSaved} />}
      {resetUser   && <ResetPwModal user={resetUser}   onClose={() => setResetUser(null)} />}
      {deleteUser  && <DeleteModal  user={deleteUser}  onClose={() => setDeleteUser(null)}  onDeleted={handleUserDeleted} />}
      {archiveUser && <ArchiveModal user={archiveUser} onClose={() => setArchiveUser(null)} onArchived={handleUserArchived} />}
      {showCreate  && <CreateModal  onClose={() => setShowCreate(false)} onCreated={handleUserCreated} />}
    </div>
  );
}