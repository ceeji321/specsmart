// src/components/Auth/AuthModal.jsx
import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Check, Circle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─── Validation rules ──────────────────────────────────────────────────────────
const NAME_REGEX = /^[a-zA-Z]+$/;

const PASSWORD_RULES = [
  { id: 'length',    label: 'At least 8 characters',               test: (p) => p.length >= 8 },
  { id: 'uppercase', label: 'At least 1 uppercase letter (A-Z)',    test: (p) => /[A-Z]/.test(p) },
  { id: 'number',    label: 'At least 1 number (0-9)',              test: (p) => /[0-9]/.test(p) },
  { id: 'special',   label: 'At least 1 special character (@!#$%^&*)',
                                                                     test: (p) => /[@!#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/.test(p) },
];

function isPasswordValid(password) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

// ─── Password strength meter ───────────────────────────────────────────────────
function PasswordStrengthMeter({ password }) {
  if (!password) return null;
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const color  = colors[passed - 1] || '#ef4444';
  const label  = labels[passed - 1] || 'Weak';

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= passed ? color : 'var(--border, #2a2a3a)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              {ok ? <Check size={11} color="#22c55e" /> : <Circle size={11} color="var(--text-3, #555)" />}
              <span style={{ color: ok ? '#22c55e' : 'var(--text-3, #555)' }}>{rule.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode]                 = useState(defaultMode);
  const [formData, setFormData]         = useState({ email: '', password: '', firstName: '', lastName: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [loading, setLoading]           = useState(false);
  const [nameErrors, setNameErrors]     = useState({ firstName: '', lastName: '' });
  const [touched, setTouched]           = useState({});

  const { login, register, supabase } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setMode(defaultMode); }, [defaultMode]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setFormData({ email: '', password: '', firstName: '', lastName: '', confirmPassword: '' });
      setNameErrors({ firstName: '', lastName: '' });
      setTouched({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Name change handler ────────────────────────────────────────────────────
  const handleNameChange = (field) => (e) => {
    const raw = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: raw }));
    setError('');
    if (raw === '') { setNameErrors((prev) => ({ ...prev, [field]: '' })); return; }
    if (!NAME_REGEX.test(raw)) {
      setNameErrors((prev) => ({ ...prev, [field]: 'Only letters allowed — no numbers, spaces, or special characters' }));
    } else {
      setNameErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key.length > 1) return;
    if (!/[a-zA-Z]/.test(e.key)) e.preventDefault();
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleBlur = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const firstName = formData.firstName.trim();
        const lastName  = formData.lastName.trim();

        if (!firstName) { setError('First name is required'); setLoading(false); return; }
        if (!NAME_REGEX.test(firstName)) { setError('First name must contain letters only — no numbers, spaces, or special characters'); setLoading(false); return; }
        if (firstName.length < 2) { setError('First name must be at least 2 characters'); setLoading(false); return; }
        if (firstName.length > 50) { setError('First name is too long (max 50 characters)'); setLoading(false); return; }

        if (!lastName) { setError('Last name is required'); setLoading(false); return; }
        if (!NAME_REGEX.test(lastName)) { setError('Last name must contain letters only — no numbers, spaces, or special characters'); setLoading(false); return; }
        if (lastName.length < 2) { setError('Last name must be at least 2 characters'); setLoading(false); return; }
        if (lastName.length > 50) { setError('Last name is too long (max 50 characters)'); setLoading(false); return; }

        const email = formData.email.trim();
        if (!email) { setError('Email is required'); setLoading(false); return; }
        if (email.length > 254) { setError('Email address is too long'); setLoading(false); return; }

        if (!isPasswordValid(formData.password)) {
          if (formData.password.length < 8) setError('Password must be at least 8 characters');
          else if (!/[A-Z]/.test(formData.password)) setError('Password must include at least one uppercase letter (A-Z)');
          else if (!/[0-9]/.test(formData.password)) setError('Password must include at least one number (0-9)');
          else setError('Password must include at least one special character (@!#$%^&* etc.)');
          setLoading(false); return;
        }

        if (formData.password.length > 128) { setError('Password is too long (max 128 characters)'); setLoading(false); return; }
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
        if (nameErrors.firstName || nameErrors.lastName) { setError('Please fix the name fields before submitting'); setLoading(false); return; }

        const result = await register({
          email,
          password: formData.password,
          name: `${firstName} ${lastName}`,
        });

        if (result.success) {
          if (result.message) {
            // Email confirmation required
            setSuccess(result.message);
          } else {
            onClose();
            navigate('/dashboard');
          }
        } else {
          setError(result.error || 'Registration failed');
        }

      } else if (mode === 'forgot') {
        // ── Use Supabase directly for password reset ──
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          formData.email.trim(),
          { redirectTo: `${window.location.origin}/reset-password` }
        );

        if (resetError) setError(resetError.message || 'Failed to send reset email');
        else setSuccess('Check your email for a password reset link!');

      } else {
        if (!formData.email.trim() || !formData.password) {
          setError('Email and password are required'); setLoading(false); return;
        }
        const result = await login(formData.email.trim(), formData.password);
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
    setFormData({ email: '', password: '', firstName: '', lastName: '', confirmPassword: '' });
    setNameErrors({ firstName: '', lastName: '' });
    setTouched({});
  };

  const titles = { login: 'Welcome Back', register: 'Create Account', forgot: 'Forgot Password' };
  const subs   = {
    login:    'Sign in to your SpecSmart account',
    register: 'Join SpecSmart today',
    forgot:   "Enter your email and we'll send you a reset link",
  };

  const showStrength = mode === 'register' && formData.password.length > 0;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 4 }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 className="modal-title">{titles[mode]}</h2>
          <p className="modal-sub">{subs[mode]}</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: 'var(--red)', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 8, color: '#4ade80', fontSize: 13 }}>
            {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>

            {/* ── Register: first + last name ── */}
            {mode === 'register' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">First Name</label>
                  <input
                    type="text" name="firstName" value={formData.firstName}
                    onChange={handleNameChange('firstName')} onKeyDown={handleNameKeyDown}
                    onBlur={handleBlur('firstName')} className="form-input" placeholder="John"
                    required maxLength={50}
                    style={{ borderColor: nameErrors.firstName && touched.firstName ? 'rgba(248,113,113,0.6)' : undefined }}
                  />
                  {nameErrors.firstName && touched.firstName && (
                    <p style={{ fontSize: 11, color: '#f87171', marginTop: 4, lineHeight: 1.4 }}>{nameErrors.firstName}</p>
                  )}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text" name="lastName" value={formData.lastName}
                    onChange={handleNameChange('lastName')} onKeyDown={handleNameKeyDown}
                    onBlur={handleBlur('lastName')} className="form-input" placeholder="Doe"
                    required maxLength={50}
                    style={{ borderColor: nameErrors.lastName && touched.lastName ? 'rgba(248,113,113,0.6)' : undefined }}
                  />
                  {nameErrors.lastName && touched.lastName && (
                    <p style={{ fontSize: 11, color: '#f87171', marginTop: 4, lineHeight: 1.4 }}>{nameErrors.lastName}</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Email ── */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email" name="email" value={formData.email}
                onChange={handleChange} className="form-input"
                placeholder="you@example.com" required maxLength={254}
              />
            </div>

            {/* ── Password ── */}
            {mode !== 'forgot' && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  {mode === 'login' && (
                    <button type="button"
                      onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange}
                    onBlur={handleBlur('password')} className="form-input"
                    placeholder="••••••••" style={{ paddingRight: 44 }} required maxLength={128}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {showStrength && <PasswordStrengthMeter password={formData.password} />}
                {mode === 'login' && (
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Password is case-sensitive</p>
                )}
              </div>
            )}

            {/* ── Confirm Password ── */}
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                    value={formData.confirmPassword} onChange={handleChange}
                    onBlur={handleBlur('confirmPassword')} className="form-input"
                    placeholder="••••••••"
                    style={{
                      paddingRight: 44,
                      borderColor:
                        touched.confirmPassword && formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? 'rgba(248,113,113,0.6)'
                          : touched.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword
                          ? 'rgba(74,222,128,0.5)'
                          : undefined,
                    }}
                    required maxLength={128}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {touched.confirmPassword && formData.confirmPassword && (
                  <p style={{ fontSize: 11, marginTop: 4, color: formData.password === formData.confirmPassword ? '#22c55e' : '#f87171' }}>
                    {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            )}

            {/* ── Submit ── */}
            <button type="submit" disabled={loading} className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: 12, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Please wait...'
                : mode === 'login'  ? 'Sign In'
                : mode === 'forgot' ? 'Send Reset Link'
                : 'Create Account'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="modal-footer">
          {mode === 'forgot' ? (
            <a onClick={() => { setMode('login'); setError(''); setSuccess(''); }} style={{ cursor: 'pointer' }}>
              Back to Sign In
            </a>
          ) : (
            <>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <a onClick={switchMode} style={{ cursor: 'pointer' }}>
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
