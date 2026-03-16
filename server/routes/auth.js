// server/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ─── Validation helpers ────────────────────────────────────────────────────────

// Name: letters only, no numbers, no spaces, no special characters
const NAME_REGEX = /^[a-zA-Z]+$/;

// Password: min 8 chars, 1 uppercase, 1 number, 1 special character
const PASSWORD_UPPER_REGEX   = /[A-Z]/;
const PASSWORD_NUMBER_REGEX  = /[0-9]/;
const PASSWORD_SPECIAL_REGEX = /[@!#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/;

function validateName(name, field) {
  if (!name || name.trim() === '')
    return `${field} is required`;
  const trimmed = name.trim();
  if (!NAME_REGEX.test(trimmed))
    return `${field} must contain letters only — no numbers, spaces, or special characters`;
  if (trimmed.length < 2)
    return `${field} must be at least 2 characters`;
  if (trimmed.length > 50)
    return `${field} must be 50 characters or fewer`;
  return null;
}

function validatePassword(password) {
  if (!password)
    return 'Password is required';
  if (password.length < 8)
    return 'Password must be at least 8 characters';
  if (password.length > 128)
    return 'Password must be 128 characters or fewer';
  if (!PASSWORD_UPPER_REGEX.test(password))
    return 'Password must include at least one uppercase letter (A-Z)';
  if (!PASSWORD_NUMBER_REGEX.test(password))
    return 'Password must include at least one number (0-9)';
  if (!PASSWORD_SPECIAL_REGEX.test(password))
    return 'Password must include at least one special character (@!#$%^&* etc.)';
  return null;
}

// ─── Send email via Brevo HTTP API ────────────────────────────────────────────
const sendBrevoEmail = async ({ to, toName, subject, html }) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: 'SpecSmart', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Brevo API error: ${err}`);
  }

  return response.json();
};

// ─── Register new user ─────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // ── Required fields ──────────────────────────────────────────────────────
    if (!email || !password || !name)
      return res.status(400).json({ error: 'Email, password, and name are required' });

    // ── Email validation ─────────────────────────────────────────────────────
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail.length > 254)
      return res.status(400).json({ error: 'Email address is too long' });
    // Basic format check (supplement browser validation)
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(trimmedEmail))
      return res.status(400).json({ error: 'Invalid email address format' });

    // ── Name validation ──────────────────────────────────────────────────────
    // The frontend sends name as "FirstName LastName" — split and validate each part
    const parts = name.trim().split(' ');
    if (parts.length < 2)
      return res.status(400).json({ error: 'Full name must include both first and last name' });

    const firstName = parts[0];
    const lastName  = parts.slice(1).join(' '); // handle edge case of multi-part last name

    const firstNameError = validateName(firstName, 'First name');
    if (firstNameError) return res.status(400).json({ error: firstNameError });

    const lastNameError = validateName(lastName, 'Last name');
    if (lastNameError) return res.status(400).json({ error: lastNameError });

    // ── Password validation ──────────────────────────────────────────────────
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    // ── Duplicate email check ────────────────────────────────────────────────
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [trimmedEmail]
    );
    if (existingUser.rows.length > 0)
      return res.status(409).json({ error: 'Email already registered' });

    // ── Create user ──────────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password, name, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, email, name, role, created_at`,
      [trimmedEmail, hashedPassword, `${firstName} ${lastName}`]
    );

    const user  = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id, email: user.email, name: user.name,
        role: user.role, createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// ─── Login user ────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password' });

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword)
      return res.status(401).json({ error: 'Invalid email or password' });

    await pool.query(
      'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id, email: user.email, name: user.name,
        role: user.role, createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ─── Get current user info ─────────────────────────────────────────────────────
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at, updated_at, last_login FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found' });

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id, email: user.email, name: user.name, role: user.role,
        createdAt: user.created_at, updatedAt: user.updated_at, lastLogin: user.last_login,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// ─── Change password (logged-in user) ─────────────────────────────────────────
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Current password and new password are required' });

    // Validate new password with the same rules
    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isValid)
      return res.status(401).json({ error: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, req.user.userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ─── Forgot password: send reset email ────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ error: 'Email is required' });

    const result = await pool.query(
      'SELECT id, name FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    // Always return the same message to prevent user enumeration
    if (result.rows.length === 0)
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });

    const user = result.rows[0];

    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, resetToken, expiresAt]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink   = `${frontendUrl}/reset-password?token=${resetToken}`;

    await sendBrevoEmail({
      to: email,
      toName: user.name,
      subject: 'Reset Your SpecSmart Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f0f; color: #e0e0e0; padding: 32px; border-radius: 12px;">
          <h2 style="color: #ffffff; margin-bottom: 8px;">Reset Your Password</h2>
          <p style="color: #aaa; margin-bottom: 24px;">Hi ${user.name}, we received a request to reset your SpecSmart password.</p>
          <a href="${resetLink}"
             style="display: inline-block; background: #3b82f6; color: #fff; text-decoration: none;
                    padding: 12px 28px; border-radius: 8px; font-weight: bold; margin-bottom: 24px;">
            Reset Password
          </a>
          <p style="color: #aaa; font-size: 13px;">This link expires in <strong>1 hour</strong>.</p>
          <p style="color: #aaa; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border-color: #333; margin-top: 24px;" />
          <p style="color: #555; font-size: 11px;">SpecSmart — PC Parts Comparison Tool</p>
        </div>
      `,
    });

    console.log(`✅ Password reset email sent to ${email}`);
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
  }
});

// ─── Reset password: validate token & set new password ────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({ error: 'Token and new password are required' });

    // Validate new password with the same rules
    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const result = await pool.query(
      `SELECT prt.*, u.email, u.name
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });

    const resetRecord    = result.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, resetRecord.user_id]
    );

    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
      [resetRecord.id]
    );

    console.log(`✅ Password reset successful for ${resetRecord.email}`);
    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// ─── Verify token: check if reset token is still valid ────────────────────────
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await pool.query(
      `SELECT id FROM password_reset_tokens
       WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
      [token]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ valid: false, error: 'Invalid or expired reset link.' });

    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ valid: false, error: 'Server error.' });
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;