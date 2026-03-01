// src/pages/ResetPasswordPage.jsx
// Place this file at: src/pages/ResetPasswordPage.jsx
// Then add this route in your App.jsx:
//   <Route path="/reset-password" element={<ResetPasswordPage />} />

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, XCircle, Loader } from 'lucide-react';

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://specsmart-production.up.railway.app';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'valid' | 'invalid' | 'success'
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    fetch(`${API_BASE}/api/auth/verify-reset-token/${token}`)
      .then(r => r.json())
      .then(data => setStatus(data.valid ? 'valid' : 'invalid'))
      .catch(() => setStatus('invalid'));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Failed to reset password');
      else setStatus('success');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg, #0f0f0f)',
    padding: '24px',
  };

  const cardStyle = {
    background: 'var(--surface, #1a1a1a)',
    border: '1px solid var(--border, #2a2a2a)',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
  };

  // ── Verifying ──────────────────────────────────────────────────────────────
  if (status === 'verifying') return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <Loader size={40} style={{ color: '#3b82f6', marginBottom: 16, animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#aaa' }}>Verifying your reset link…</p>
      </div>
    </div>
  );

  // ── Invalid / expired ──────────────────────────────────────────────────────
  if (status === 'invalid') return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <XCircle size={48} style={{ color: '#f87171', marginBottom: 16 }} />
        <h2 style={{ color: '#fff', marginBottom: 8 }}>Link Expired</h2>
        <p style={{ color: '#aaa', marginBottom: 24, fontSize: 14 }}>
          This password reset link is invalid or has expired. Reset links are valid for 1 hour.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', cursor: 'pointer', fontWeight: 600 }}>
          Back to Home
        </button>
      </div>
    </div>
  );

  // ── Success ────────────────────────────────────────────────────────────────
  if (status === 'success') return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <CheckCircle size={48} style={{ color: '#4ade80', marginBottom: 16 }} />
        <h2 style={{ color: '#fff', marginBottom: 8 }}>Password Reset!</h2>
        <p style={{ color: '#aaa', marginBottom: 24, fontSize: 14 }}>
          Your password has been updated successfully. You can now sign in with your new password.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', cursor: 'pointer', fontWeight: 600 }}>
          Go to Sign In
        </button>
      </div>
    </div>
  );

  // ── Reset form ─────────────────────────────────────────────────────────────
  return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle, textAlign: 'left' }}>
        <h2 style={{ color: '#fff', marginBottom: 8, textAlign: 'center' }}>Set New Password</h2>
        <p style={{ color: '#aaa', marginBottom: 24, fontSize: 14, textAlign: 'center' }}>
          Choose a strong password for your account.
        </p>

        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#ccc', fontSize: 13, marginBottom: 6 }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8,
                  padding: '10px 40px 10px 12px', color: '#fff', fontSize: 14, boxSizing: 'border-box',
                }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#ccc', fontSize: 13, marginBottom: 6 }}>Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              required
              style={{
                width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8,
                padding: '10px 12px', color: '#fff', fontSize: 14, boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password strength indicator */}
          {newPassword.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: newPassword.length >= i * 3
                      ? (newPassword.length >= 10 ? '#4ade80' : newPassword.length >= 6 ? '#facc15' : '#f87171')
                      : '#333',
                  }} />
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#666' }}>
                {newPassword.length < 6 ? 'Too short' : newPassword.length < 8 ? 'Weak' : newPassword.length < 10 ? 'Fair' : 'Strong'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: '#3b82f6', color: '#fff', border: 'none',
              borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
            }}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}