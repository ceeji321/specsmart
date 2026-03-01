// src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import AuthModal from '../components/Auth/AuthModal';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Don't render anything if logged in
  if (isAuthenticated) return null;

  const openAuth = (mode) => { setAuthMode(mode); setShowAuth(true); };

  const handleGetStarted = () => {
    if (isAuthenticated) navigate('/dashboard');
    else openAuth('register');
  };

  const handleBrowse = () => {
    if (isAuthenticated) navigate('/dashboard');
    else openAuth('login');
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="page">
      {/* Simple Landing Navbar (no auth dropdown) */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,11,15,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>
          Spec<span style={{ color: 'var(--accent)' }}>Smart</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn btn-ghost"
            onClick={() => openAuth('login')}
            style={{ padding: '8px 18px', fontSize: 14 }}
          >
            Sign In
          </button>
          <button
            className="btn btn-primary"
            onClick={() => openAuth('register')}
            style={{ padding: '8px 18px', fontSize: 14 }}
          >
            Get Started
          </button>
        </div>
      </nav>

      <section className="landing-hero" style={{ paddingTop: '80px' }}>
        <div className="hero-bg" />

        <div className="hero-badge" style={{ animationDelay: '0s' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          AI-Powered Tech Advisor
        </div>

        <h1 className="hero-title fade-up">Your Smartest<br />Tech Companion</h1>

        <p className="hero-sub fade-up" style={{ animationDelay: '0.1s' }}>
          Compare CPUs, GPUs, smartphones, keyboards, and mice. Ask anything about PC hardware — SpecSmart AI gives you expert answers in seconds.
        </p>

        <div className="hero-cta fade-up" style={{ animationDelay: '0.2s' }}>
          <button className="btn btn-primary" onClick={handleGetStarted} style={{ padding: '14px 28px', fontSize: '15px' }}>
            Get Started Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <button className="btn btn-ghost" onClick={handleBrowse} style={{ padding: '14px 28px', fontSize: '15px' }}>
            Browse Devices
          </button>
        </div>

        <div className="features-grid fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <div className="feature-title">AI Chat Advisor</div>
            <div className="feature-desc">Ask anything about PC parts, phones, keyboards & mice. Get expert answers instantly.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚖️</div>
            <div className="feature-title">Side-by-Side Compare</div>
            <div className="feature-desc">Compare specs of any two devices across all categories with clear visual breakdowns.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <div className="feature-title">Image Recognition</div>
            <div className="feature-desc">Upload a photo of any hardware component and our AI identifies it and explains its specs.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <div className="feature-title">Smart Search</div>
            <div className="feature-desc">Filter by category, brand, or budget. Find the perfect device for your needs instantly.</div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ padding: '100px 24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div className="hero-badge" style={{ margin: '0 auto 20px' }}>About Us</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text)' }}>
          Built for Tech Enthusiasts
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text-2)', lineHeight: 1.8, marginBottom: '16px' }}>
          SpecSmart is an AI-powered tech companion built to help you make smarter hardware decisions. Whether you're building a PC, picking a new phone, or comparing peripherals, we give you instant, accurate, and easy-to-understand spec comparisons.
        </p>
        <p style={{ fontSize: '16px', color: 'var(--text-2)', lineHeight: 1.8 }}>
          Our platform combines a comprehensive device database with cutting-edge AI to deliver expert-level advice to everyone — from first-time buyers to seasoned enthusiasts.
        </p>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '100px 24px', maxWidth: '600px', margin: '0 auto', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <div className="hero-badge" style={{ margin: '0 auto 20px' }}>Contact</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text)' }}>
          Get In Touch
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text-2)', lineHeight: 1.8, marginBottom: '32px' }}>
          Have questions, feedback, or want to partner with us? We'd love to hear from you.
        </p>
        <a href="mailto:support@specsmart.com" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '15px' }}>
          support@specsmart.com
        </a>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '12px' }}>© 2026 SpecSmart. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          {[['About', 'about'], ['Contact', 'contact']].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--text-3)', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
          <a href="#" style={{ fontSize: '13px', color: 'var(--text-3)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" style={{ fontSize: '13px', color: 'var(--text-3)', textDecoration: 'none' }}>Terms of Service</a>
        </div>
      </footer>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} defaultMode={authMode} />
    </div>
  );
}