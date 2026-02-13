import { useState } from 'react';

export default function AuthModal({ mode, onClose, onLogin, onSwitchMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'4px'}}>
          <div className="modal-title">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',padding:'4px'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="modal-sub">
          {mode === 'login' ? 'Sign in to your SpecSmart account' : 'Start exploring tech specs with AI'}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" placeholder="Alex Mercer" value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="alex@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{width:'100%', justifyContent:'center', marginTop:'8px', padding:'12px'}}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="modal-footer">
          {mode === 'login' ? (
            <>Don't have an account? <a onClick={onSwitchMode}>Sign up</a></>
          ) : (
            <>Already have an account? <a onClick={onSwitchMode}>Sign in</a></>
          )}
        </div>
      </div>
    </div>
  );
}
