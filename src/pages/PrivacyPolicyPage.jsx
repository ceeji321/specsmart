// src/pages/PrivacyPolicyPage.jsx
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    title: '1. Information We Collect',
    body: 'We collect information you provide directly to us, such as your name and email address when you create an account. We also collect usage data automatically when you interact with SpecSmart, including device information, pages visited, and features used.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use your information to provide, maintain, and improve our services, to communicate with you about updates or support, and to ensure the security of our platform. We do not sell your personal data to third parties.',
  },
  {
    title: '3. Data Storage & Security',
    body: 'Your data is securely stored using Supabase infrastructure with industry-standard encryption. We implement technical and organizational measures to protect your information against unauthorized access, alteration, or destruction.',
  },
  {
    title: '4. Cookies & Sessions',
    body: 'We use session cookies to keep you logged in and to remember your preferences. We do not use advertising or cross-site tracking cookies.',
  },
  {
    title: '5. Third-Party Services',
    body: 'SpecSmart uses Supabase for authentication and data storage, and may use AI services to power our chat and comparison features. These services have their own privacy policies and handle data in accordance with their respective terms.',
  },
  {
    title: '6. Your Rights',
    body: 'You may request access to, correction of, or deletion of your personal data at any time. You can update your profile information directly within the app or contact us at support@specsmart.com for account deletion requests.',
  },
  {
    title: '7. Data Retention',
    body: 'We retain your account data for as long as your account is active. If you delete your account, we will remove your personal information within 30 days, except where required by law.',
  },
  {
    title: '8. Changes to This Policy',
    body: 'We may update this Privacy Policy periodically. We will notify you of significant changes via email or a notice on our platform. Continued use of SpecSmart after changes constitutes your acceptance of the updated policy.',
  },
  {
    title: '9. Contact Us',
    body: 'If you have any questions or concerns about this Privacy Policy or how we handle your data, please contact us at support@specsmart.com.',
  },
];

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="page" style={{ minHeight: '100vh' }}>
      {/* Navbar */}
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
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--text)' }}
        >
          Spec<span style={{ color: 'var(--accent)' }}>Smart</span>
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => navigate(-1)}
          style={{ padding: '8px 18px', fontSize: 14 }}
        >
          ← Back
        </button>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 100px' }}>
        <div className="hero-badge" style={{ marginBottom: 20 }}>Legal</div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.2rem', fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--text-3)', marginBottom: 48, fontSize: 14 }}>
          Last updated: March 20, 2026
        </p>

        <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 48 }}>
          At SpecSmart, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.
        </p>

        {sections.map(({ title, body }) => (
          <div key={title} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>{title}</h2>
            <p style={{ color: 'var(--text-2)', lineHeight: 1.8, fontSize: 15 }}>{body}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>© 2026 SpecSmart. All rights reserved.</p>
      </footer>
    </div>
  );
}