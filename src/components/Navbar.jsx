import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const mockUser = { name: 'Alex Mercer', username: '@merceralex' };

const initials = (name) => name.split(' ').map(n => n[0]).join('');

export default function Navbar({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout?.();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="nav-logo">
        Spec<span>Smart</span>
      </Link>

      <div className="nav-actions">
        {/* Compare */}
        <Link
          to="/compare"
          className={`nav-btn ${location.pathname === '/compare' ? 'active' : ''}`}
          title="Compare Devices"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="8" height="18" rx="1"/>
            <rect x="14" y="3" width="8" height="18" rx="1"/>
          </svg>
        </Link>

        {/* History */}
        <Link
          to="/history"
          className={`nav-btn ${location.pathname === '/history' ? 'active' : ''}`}
          title="Chat History"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </Link>

        {/* Profile */}
        <div className="profile-wrapper">
          <div className="profile-btn">
            <div className="profile-avatar">{initials(mockUser.name)}</div>
            <span className="profile-name">{mockUser.name.split(' ')[0]}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'var(--text-3)'}}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>

          <div className="profile-dropdown">
            <div className="profile-dropdown-header">
              <div className="name">{mockUser.name}</div>
              <div className="username">{mockUser.username}</div>
            </div>

            <Link to="/dashboard" className="dropdown-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Personalization
            </Link>

            <Link to="/dashboard" className="dropdown-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Settings
            </Link>

            <div className="dropdown-divider"/>

            <Link to="/dashboard" className="dropdown-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Help
            </Link>

            <button onClick={handleLogout} className="dropdown-item danger">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}