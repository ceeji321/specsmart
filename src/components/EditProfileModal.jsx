// src/components/EditProfileModal.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Check, User, Mail } from 'lucide-react';

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

export default function EditProfileModal({ onClose }) {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSave = async () => {
    if (!name.trim()) { setMsg({ type: 'error', text: 'Name cannot be empty' }); return; }
    if (!email.trim()) { setMsg({ type: 'error', text: 'Email cannot be empty' }); return; }

    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: 'error', text: data.error || 'Update failed' }); return; }

      updateUser({ name: data.user.name, email: data.user.email });

      if (data.user.email !== user.email) {
        setMsg({ type: 'success', text: 'Profile updated! Email changed — please log in again.' });
        setTimeout(() => logout(), 2500);
      } else {
        setMsg({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440 }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
          <X size={18} />
        </button>

        <div className="modal-title" style={{ fontSize: 18, marginBottom: 4 }}>Edit Profile</div>
        <p className="modal-sub" style={{ marginBottom: 24 }}>{user?.email}</p>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={12} style={{ color: 'var(--text-3)' }} /> Full Name
          </label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mail size={12} style={{ color: 'var(--text-3)' }} /> Email Address
          </label>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
            ⚠️ Changing your email will sign you out.
          </p>
        </div>

        {msg && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
            background: msg.type === 'success' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
            color: msg.type === 'success' ? '#4ade80' : 'var(--red)',
          }}>{msg.text}</div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Saving…' : <><Check size={14} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}