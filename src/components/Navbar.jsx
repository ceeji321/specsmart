// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EditProfileModal from './EditProfileModal';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const initials = (user?.name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const hue = (user?.name || '').charCodeAt(0) * 7 % 360;
  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    fontSize: 14,
    fontWeight: 500,
    color: isActive(path) ? 'var(--accent)' : 'var(--text-2)',
    textDecoration: 'none',
    transition: 'color 0.15s',
  });

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,11,15,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>
            Spec<span style={{ color: 'var(--accent)' }}>Smart</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Regular user nav links */}
          {!isAdmin && (
            <>
              {!isActive('/dashboard') && (
                <Link to="/dashboard" style={navLinkStyle('/dashboard')}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
                >Dashboard</Link>
              )}
              {!isActive('/compare') && (
                <Link to="/compare" style={navLinkStyle('/compare')}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
                >Compare</Link>
              )}
              {!isActive('/history') && (
                <Link to="/history" style={navLinkStyle('/history')}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
                >History</Link>
              )}
            </>
          )}

          {/* Admin nav link */}
          {isAdmin && !isActive('/admin') && (
            <Link to="/admin" style={navLinkStyle('/admin')}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}
            >Admin</Link>
          )}

          {/* Avatar dropdown */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setDropdownOpen(o => !o)} style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, hsl(${hue},60%,50%), hsl(${hue + 40},70%,40%))`,
              border: 'none', cursor: 'pointer',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13,
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{initials}</button>

            {dropdownOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setDropdownOpen(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 99,
                  background: 'var(--bg-2)', border: '1px solid var(--border-light)',
                  borderRadius: 12, minWidth: 200, boxShadow: 'var(--shadow)', overflow: 'hidden',
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{user?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{user?.email}</div>
                  </div>

                  <div style={{ padding: '6px 0' }}>
                    {!isAdmin && (
                      <>
                        {!isActive('/dashboard') && (
                          <button onClick={() => { navigate('/dashboard'); setDropdownOpen(false); }}
                            className="dropdown-item" style={{ width: '100%', textAlign: 'left' }}>Dashboard</button>
                        )}
                        {!isActive('/compare') && (
                          <button onClick={() => { navigate('/compare'); setDropdownOpen(false); }}
                            className="dropdown-item" style={{ width: '100%', textAlign: 'left' }}>Compare</button>
                        )}
                        {!isActive('/history') && (
                          <button onClick={() => { navigate('/history'); setDropdownOpen(false); }}
                            className="dropdown-item" style={{ width: '100%', textAlign: 'left' }}>History</button>
                        )}
                        <div className="dropdown-divider" />
                        <button className="dropdown-item"
                          onClick={() => { setShowEditProfile(true); setDropdownOpen(false); }}
                          style={{ width: '100%', textAlign: 'left', color: 'var(--accent)' }}>
                          ✏️ Edit Profile
                        </button>
                      </>
                    )}

                    {isAdmin && !isActive('/admin') && (
                      <button onClick={() => { navigate('/admin'); setDropdownOpen(false); }}
                        className="dropdown-item" style={{ width: '100%', textAlign: 'left' }}>
                        Admin Panel
                      </button>
                    )}

                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={handleLogout}
                      style={{ width: '100%', textAlign: 'left', color: 'var(--red)' }}>
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
    </>
  );
}