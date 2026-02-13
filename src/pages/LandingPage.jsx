import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage({ isLoggedIn, onSignIn }) {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isLoggedIn) navigate('/dashboard');
    else onSignIn();
  };

  return (
    <div className="page">
      {/* Navbar */}
      <nav className="navbar">
        <span className="nav-logo">Spec<span>Smart</span></span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/" style={{ fontSize: '14px', color: 'var(--text-2)', textDecoration: 'none' }}>About</Link>
          <Link to="/" style={{ fontSize: '14px', color: 'var(--text-2)', textDecoration: 'none' }}>Contact</Link>
          {isLoggedIn ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>Dashboard</Link>
          ) : (
            <button className="btn btn-primary" onClick={onSignIn} style={{ padding: '8px 18px', fontSize: '13px' }}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-bg" />

        <div className="hero-badge" style={{ animationDelay: '0s' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          AI-Powered Tech Advisor
        </div>

        <h1 className="hero-title fade-up">
          Your Smartest<br />Tech Companion
        </h1>

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
          <button className="btn btn-ghost" onClick={handleGetStarted} style={{ padding: '14px 28px', fontSize: '15px' }}>
            Browse Devices
          </button>
        </div>

        {/* Features */}
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

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '12px' }}>
          © 2026 SpecSmart. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          {['About', 'Contact', 'Privacy Policy', 'Terms of Service'].map(l => (
            <a key={l} href="#" style={{ fontSize: '13px', color: 'var(--text-3)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}