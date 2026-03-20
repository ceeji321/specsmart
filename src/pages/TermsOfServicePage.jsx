// src/pages/TermsOfServicePage.jsx
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using SpecSmart, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our service.',
  },
  {
    title: '2. Use of Service',
    body: 'SpecSmart is intended for lawful use only. You agree not to use our platform to transmit harmful, offensive, or illegal content, to attempt to gain unauthorized access to any part of our systems, or to engage in any activity that disrupts or interferes with the service.',
  },
  {
    title: '3. User Accounts',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify us immediately if you suspect unauthorized access to your account. You must be at least 13 years old to use SpecSmart.',
  },
  {
    title: '4. AI-Generated Content',
    body: 'SpecSmart uses AI to provide tech advice and comparisons. While we strive for accuracy, AI-generated responses may not always be correct or up to date. You should verify critical purchasing decisions with official manufacturer specifications.',
  },
  {
    title: '5. Intellectual Property',
    body: 'All content, branding, logos, and technology within SpecSmart are owned by SpecSmart and protected by applicable intellectual property laws. You may not copy, modify, distribute, or reproduce any part of our platform without written permission.',
  },
  {
    title: '6. User Content',
    body: 'Any content you submit to SpecSmart (such as chat messages or comparison requests) remains yours. By submitting content, you grant SpecSmart a non-exclusive license to use it to operate and improve the service.',
  },
  {
    title: '7. Account Termination',
    body: 'We reserve the right to suspend or terminate your account at any time if you violate these Terms of Service, engage in behavior harmful to other users, or for any other reason at our discretion. You may also delete your account at any time.',
  },
  {
    title: '8. Disclaimer of Warranties',
    body: 'SpecSmart is provided "as is" and "as available" without warranties of any kind, express or implied. We do not guarantee that the service will be uninterrupted, error-free, or free of viruses or other harmful components.',
  },
  {
    title: '9. Limitation of Liability',
    body: 'To the fullest extent permitted by law, SpecSmart and its team shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the service.',
  },
  {
    title: '10. Changes to Terms',
    body: 'We may update these Terms of Service at any time. We will notify you of significant changes via email or a prominent notice on our platform. Your continued use of SpecSmart after changes take effect constitutes your acceptance of the new terms.',
  },
  {
    title: '11. Governing Law',
    body: 'These Terms of Service shall be governed by and construed in accordance with applicable laws. Any disputes arising from these terms shall be resolved through good-faith negotiation before pursuing formal legal remedies.',
  },
  {
    title: '12. Contact Us',
    body: 'If you have any questions about these Terms of Service, please contact us at support@specsmart.com.',
  },
];

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p style={{ color: 'var(--text-3)', marginBottom: 48, fontSize: 14 }}>
          Last updated: March 20, 2026
        </p>

        <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 48 }}>
          Please read these Terms of Service carefully before using SpecSmart. These terms govern your access to and use of our platform and services.
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