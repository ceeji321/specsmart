// src/components/Auth/AuthModal.jsx
import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [mode, setMode] = useState(defaultMode);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setMode(defaultMode); }, [defaultMode]);
  useEffect(() => { 
    if (isOpen) { 
      setError(''); 
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
          setError('Passwords do not match'); 
          setLoading(false); 
          return; 
        }
        if (formData.password.length < 6) { 
          setError('Password must be at least 6 characters'); 
          setLoading(false); 
          return; 
        }
        
        const result = await register({ 
          email: formData.email, 
          password: formData.password, 
          name: formData.name 
        });
        
        if (result.success) { 
          onClose();
          // Navigate to dashboard after successful registration
          navigate('/dashboard');
        } else { 
          setError(result.error || 'Registration failed'); 
        }
      } else {
        const result = await login(formData.email, formData.password);
        
        if (result.success) { 
          onClose();
          // Navigate to dashboard after successful login
          navigate('/dashboard');
        } else { 
          setError(result.error || 'Login failed'); 
        }
      }
    } catch (err) { 
      console.error('Auth error:', err);
      setError('Something went wrong. Please try again.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setFormData({ email: '', password: '', name: '', confirmPassword: '' });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '16px', 
            right: '16px', 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-2)', 
            cursor: 'pointer', 
            padding: '4px' 
          }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '24px' }}>
          <h2 className="modal-title">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="modal-sub">{mode === 'login' ? 'Sign in to your SpecSmart account' : 'Join SpecSmart today'}</p>
        </div>

        {error && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px 16px', 
            background: 'rgba(248,113,113,0.1)', 
            border: '1px solid rgba(248,113,113,0.3)', 
            borderRadius: '8px', 
            color: 'var(--red)', 
            fontSize: '13px' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className="form-input" 
                placeholder="John Doe" 
                required 
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              className="form-input" 
              placeholder="you@example.com" 
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                style={{ paddingRight: '44px' }}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-3)', 
                  cursor: 'pointer' 
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              marginTop: '8px', 
              padding: '12px', 
              opacity: loading ? 0.6 : 1 
            }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="modal-footer">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <a onClick={switchMode}>{mode === 'login' ? 'Sign up' : 'Sign in'}</a>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;