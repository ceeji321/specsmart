// src/components/Auth/EditProfileModal.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { X, Check, User, Mail } from 'lucide-react';

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://specsmart-production-ed74.up.railway.app';

async function getHeaders() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

export default function EditProfileModal({ onClose }) {
  const { user, updateUser, logout } = useAuth();

  const [name,    setName]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const headers = await getHeaders();
        if (!headers.Authorization) {
          setName(user?.user_metadata?.name || user?.email?.split('@')[0] || '');
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE}/api/users/profile`, { headers });
        if (res.ok) {
          const data = await res.json();
          const displayName = data.user?.username || data.user?.name || '';
          setName(displayName);
        } else {
          setName(user?.user_metadata?.name || '');
        }
      } catch {
        setName(user?.user_metadata?.name || '');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) { setMsg({ type: 'error', text: 'Name cannot be empty' }); return; }

    setSaving(true);
    setMsg(null);
    try {
      const headers = await getHeaders();
      if (!headers.Authorization) {
        setMsg({ type: 'error', text: 'Session expired. Please log in again.' });
        setTimeout(() => logout(), 1500);
        return;
      }

      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method : 'PUT',
        headers,
        body   : JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error || 'Update failed' });
        return;
      }

      updateUser({
        name    : data.user.username || data.user.name,
        email   : data.user.email,
        username: data.user.username,
      });

      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => onClose(), 1500);
    } catch {
      setMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 440, textAlign: 'center', padding: 40 }}>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440 }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer'
        }}>
          <X size={18} />
        </button>

        <div className="modal-title" style={{ fontSize: 18, marginBottom: 4 }}>Edit Profile</div>
        <p className="modal-sub" style={{ marginBottom: 24 }}>{user?.email}</p>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={12} style={{ color: 'var(--text-3)' }} /> Username
          </label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your username"
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mail size={12} style={{ color: 'var(--text-3)' }} /> Email Address
          </label>
          <input
            className="form-input"
            type="email"
            value={user?.email || ''}
            readOnly
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
          />
        </div>

        {msg && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
            background: msg.type === 'success'
              ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${msg.type === 'success'
              ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
            color: msg.type === 'success' ? '#4ade80' : 'var(--red)',
          }}>{msg.text}</div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}
            disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Saving…' : <><Check size={14} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}