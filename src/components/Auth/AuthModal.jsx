// src/components/Auth/AuthModal.jsx
import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://specsmart-production.up.railway.app';

const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode] = useState(defaultMode); // 'login' | 'register' | 'forgot'
  const [formData, setFormData] = useState({ email: '', password: '', name: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setMode(defaultMode); }, [defaultMode]);
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setFormData({ email: '', password: '', name: '', confirmPassword: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match'); setLoading(false); return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters'); setLoading(false); return;
        }
        const result = await register({ email: formData.email, password: formData.password, name: formData.name });
        if (result.success) { onClose(); navigate('/dashboard'); }
        else setError(result.error || 'Registration failed');

      } else if (mode === 'forgot') {
        // ── Real email-based password reset ──────────────────────────────────
        const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email }),
        });
        const data = await res.json();
        if (!res.ok) setError(data.error || 'Failed to send reset email');
        else setSuccess(data.message || 'Check your email for a password reset link!');

      } else {
        const result = await login(formData.email, formData.password);
        if (result.success) { onClose(); navigate('/dashboard'); }
        else setError(result.error || 'Login failed');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(''); setSuccess('');
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
  };

  const titles = { login: 'Welcome Back', register: 'Create Account', forgot: 'Forgot Password' };
  const subs   = {
    login: 'Sign in to your SpecSmart account',
    register: 'Join SpecSmart today',
    forgot: 'Enter your email and we\'ll send you a reset link',
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 4 }}>
          <X size={20} />
        </button>

        <div style={{ marginBottom: 24 }}>
          <h2 className="modal-title">{titles[mode]}</h2>
          <p className="modal-sub">{subs[mode]}</p>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: 'var(--red)', fontSize: 13 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 8, color: '#4ade80', fontSize: 13 }}>
            {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="John Doe" required />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="you@example.com" required />
            </div>

            {mode !== 'forgot' && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password" value={formData.password} onChange={handleChange}
                    className="form-input" placeholder="••••••••" style={{ paddingRight: 44 }} required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword}
                  onChange={handleChange} className="form-input" placeholder="••••••••" required />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: 12, opacity: loading ? 0.6 : 1 }}>
              {loading
                ? 'Please wait...'
                : mode === 'login' ? 'Sign In'
                : mode === 'forgot' ? 'Send Reset Link'
                : 'Create Account'}
            </button>
          </form>
        )}

        <div className="modal-footer">
          {mode === 'forgot' ? (
            <a onClick={() => { setMode('login'); setError(''); setSuccess(''); }} style={{ cursor: 'pointer' }}>
              Back to Sign In
            </a>
          ) : (
            <>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <a onClick={switchMode} style={{ cursor: 'pointer' }}>{mode === 'login' ? 'Sign up' : 'Sign in'}</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;