// src/components/Navbar.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './Auth/AuthModal';
import { LogOut, LayoutDashboard, Shield, History, GitCompare, Trash2, Archive } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = user?.role === 'admin';

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin');
      } else if (location.pathname === '/dashboard') {
        window.location.reload();
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/');
    }
  };

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    background: isActive(path) ? 'var(--bg-2)' : 'none',
    border: 'none',
    color: isActive(path) ? 'var(--accent)' : 'var(--text-2)',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 14px',
    borderRadius: '8px',
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: isActive(path) ? '600' : '400',
    transition: 'all 0.2s',
  });

  return (
    <>
      <nav className="navbar">
        <a
          href={isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/'}
          className="nav-logo"
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        >
          Spec<span>Smart</span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <>
                  <button
                    style={linkStyle('/admin/deleted')}
                    onClick={() => navigate('/admin/deleted')}
                  >
                    Deleted History
                  </button>
                  <button
                    style={linkStyle('/admin/archived')}
                    onClick={() => navigate('/admin/archived')}
                  >
                    Archive History
                  </button>
                </>
              ) : (
                <>
                  <button
                    style={linkStyle('/dashboard')}
                    onClick={() => navigate('/dashboard')}
                  >
                    Dashboard
                  </button>
                  <button
                    style={linkStyle('/compare')}
                    onClick={() => navigate('/compare')}
                  >
                    Compare
                  </button>
                  <button
                    style={linkStyle('/history')}
                    onClick={() => navigate('/history')}
                  >
                    History
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button style={linkStyle('/about')} onClick={() => {
                const el = document.getElementById('about');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>
                About
              </button>
              <button style={linkStyle('/contact')} onClick={() => {
                const el = document.getElementById('contact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>
                Contact
              </button>
            </>
          )}

          {isAuthenticated ? (
            <div className="profile-wrapper" style={{ marginLeft: '8px' }}>
              <div className="profile-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="profile-avatar">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="profile-name">{user?.name}</span>
              </div>

              {showUserMenu && (
                <div className="profile-dropdown" style={{ opacity: 1, pointerEvents: 'all', transform: 'translateY(0)' }}>
                  <div className="profile-dropdown-header">
                    <div className="name">{user?.name}</div>
                    <div className="username">{user?.email}</div>
                  </div>

                  {isAdmin ? (
                    <>
                      <button
                        onClick={() => { navigate('/admin'); setShowUserMenu(false); }}
                        className="dropdown-item"
                      >
                        <Shield size={16} /> Admin Panel
                      </button>
                      <button
                        onClick={() => { navigate('/admin/deleted'); setShowUserMenu(false); }}
                        className="dropdown-item"
                      >
                        <Trash2 size={16} /> Deleted History
                      </button>
                      <button
                        onClick={() => { navigate('/admin/archived'); setShowUserMenu(false); }}
                        className="dropdown-item"
                      >
                        <Archive size={16} /> Archive History
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { navigate('/dashboard'); setShowUserMenu(false); }}
                        className="dropdown-item"
                      >
                        <LayoutDashboard size={16} /> Dashboard
                      </button>
                      <button
                        onClick={() => { navigate('/compare'); setShowUserMenu(false); }}
                        className="dropdown-item"
                      >
                        <GitCompare size={16} /> Compare
                      </button>
                      <button
                        onClick={() => { navigate('/history'); setShowUserMenu(false); }}
                        className="dropdown-item"
                      >
                        <History size={16} /> History
                      </button>
                    </>
                  )}

                  <div className="dropdown-divider" />
                  <button onClick={handleLogout} className="dropdown-item danger">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => openAuthModal('login')}
              style={{ padding: '8px 18px', fontSize: '13px', marginLeft: '8px' }}
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </>
  );
};

export default Navbar;