import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Validation helpers ────────────────────────────────────────────────────────

const NAME_REGEX = /^[a-zA-Z]+$/;
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

// ─── Send email via Brevo ──────────────────────────────────────────────────────
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

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name)
      return res.status(400).json({ error: 'Email, password, and name are required' });

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail.length > 254)
      return res.status(400).json({ error: 'Email address is too long' });
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(trimmedEmail))
      return res.status(400).json({ error: 'Invalid email address format' });

    const parts = name.trim().split(' ');
    if (parts.length < 2)
      return res.status(400).json({ error: 'Full name must include both first and last name' });

    const firstName = parts[0];
    const lastName  = parts.slice(1).join(' ');

    const firstNameError = validateName(firstName, 'First name');
    if (firstNameError) return res.status(400).json({ error: firstNameError });

    const lastNameError = validateName(lastName, 'Last name');
    if (lastNameError) return res.status(400).json({ error: lastNameError });

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const fullName = `${firstName} ${lastName}`;

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
      user_metadata: { name: fullName, role: 'user' },
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.code === 'email_exists') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      console.error('Supabase register error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    const supabaseUser = authData.user;

    try {
      await pool.query(
        `INSERT INTO users (id, username, email, name, role, password_hash, status, created_at)
         VALUES ($1, $2, $3, $4, 'user', 'supabase_managed', 'active', NOW())
         ON CONFLICT (email) DO NOTHING`,
        [supabaseUser.id, trimmedEmail, trimmedEmail, fullName]
      );
    } catch (dbError) {
      console.error('DB sync error (non-fatal):', dbError.message);
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (signInError) {
      return res.status(201).json({
        message: 'User registered successfully. Please log in.',
        user: { id: supabaseUser.id, email: trimmedEmail, name: fullName, role: 'user' },
      });
    }

    res.status(201).json({
      message: 'User registered successfully',
      token: signInData.session.access_token,
      user: {
        id: supabaseUser.id,
        email: trimmedEmail,
        name: fullName,
        role: 'user',
        createdAt: supabaseUser.created_at,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// ─── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const trimmedEmail = email.trim().toLowerCase();

    // ── Check if account is disabled or archived ──────────────────────────────
    try {
      const userCheck = await pool.query(
        `SELECT is_disabled, is_archived FROM users WHERE email = $1`,
        [trimmedEmail]
      );
      if (userCheck.rows.length > 0) {
        const u = userCheck.rows[0];
        if (u.is_archived)
          return res.status(403).json({ error: 'This account has been archived. Please contact support.' });
        if (u.is_disabled)
          return res.status(403).json({ error: 'This account has been disabled. Please contact support.' });
      }
    } catch (dbCheckError) {
      console.error('DB account status check error (non-fatal):', dbCheckError.message);
    }

    // ── Supabase sign in ──────────────────────────────────────────────────────
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error)
      return res.status(401).json({ error: 'Invalid email or password' });

    const supabaseUser = data.user;
    const role = supabaseUser.user_metadata?.role || 'user';
    const name = supabaseUser.user_metadata?.name || trimmedEmail.split('@')[0];

    // ── Update last_login safely — only column that always exists ─────────────
    try {
      const updateResult = await pool.query(
        `UPDATE users SET last_login = NOW() WHERE email = $1 RETURNING last_login`,
        [trimmedEmail]
      );
      if (updateResult.rowCount === 0) {
        // User exists in Supabase but not in our DB yet — insert them
        await pool.query(
          `INSERT INTO users (id, username, email, name, role, password_hash, status, last_login, created_at)
           VALUES ($1, $2, $3, $4, $5, 'supabase_managed', 'active', NOW(), NOW())
           ON CONFLICT (email) DO UPDATE SET last_login = NOW()`,
          [supabaseUser.id, trimmedEmail, trimmedEmail, name, role]
        );
      }
    } catch (dbErr) {
      console.error('last_login update error (non-fatal):', dbErr.message);
    }

    res.json({
      message: 'Login successful',
      token: data.session.access_token,
      user: { id: supabaseUser.id, email: trimmedEmail, name, role, createdAt: supabaseUser.created_at },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// ─── Get current user (/me) ───────────────────────────────────────────────────
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // ── Try PostgreSQL first ──────────────────────────────────────────────────
    try {
      const result = await pool.query(
        'SELECT id, email, name, role, status, created_at, last_login FROM users WHERE email = $1',
        [req.user.email]
      );

      if (result.rows.length > 0) {
        const user = result.rows[0];
        return res.json({
          user: {
            id:        user.id,
            email:     user.email,
            name:      user.name,
            role:      req.user.role || user.role,
            status:    user.status,
            createdAt: user.created_at,
            lastLogin: user.last_login,
          },
        });
      }
    } catch (dbError) {
      console.error('PostgreSQL /me error (non-fatal):', dbError.message);
    }

    // ── Fallback: get from Supabase Auth ─────────────────────────────────────
    const { data: { user: supabaseUser }, error } =
      await supabase.auth.admin.getUserById(req.user.userId);

    if (error || !supabaseUser)
      return res.status(404).json({ error: 'User not found' });

    // ── Sync to PostgreSQL for next time ──────────────────────────────────────
    try {
      await pool.query(
        `INSERT INTO users (id, username, email, name, role, password_hash, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'supabase_managed', 'active', NOW())
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role`,
        [
          supabaseUser.id,
          supabaseUser.email,
          supabaseUser.email,
          supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
          supabaseUser.user_metadata?.role || 'user',
        ]
      );
    } catch (_) {}

    res.json({
      user: {
        id:        supabaseUser.id,
        email:     supabaseUser.email,
        name:      supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
        role:      supabaseUser.user_metadata?.role || 'user',
        status:    'active',
        createdAt: supabaseUser.created_at,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// ─── Change password ──────────────────────────────────────────────────────────
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Current password and new password are required' });

    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword,
    });

    if (verifyError)
      return res.status(401).json({ error: 'Current password is incorrect' });

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      req.user.userId,
      { password: newPassword }
    );

    if (updateError)
      return res.status(400).json({ error: updateError.message });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ─── Forgot password ──────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ error: 'Email is required' });

    const trimmedEmail = email.trim().toLowerCase();

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const supabaseUser = users.find(u => u.email === trimmedEmail);

    if (!supabaseUser)
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });

    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [supabaseUser.id]).catch(() => {});

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt  = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [supabaseUser.id, resetToken, expiresAt]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink   = `${frontendUrl}/reset-password?token=${resetToken}`;
    const userName    = supabaseUser.user_metadata?.name || trimmedEmail;

    await sendBrevoEmail({
      to: trimmedEmail,
      toName: userName,
      subject: 'Reset Your SpecSmart Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f0f; color: #e0e0e0; padding: 32px; border-radius: 12px;">
          <h2 style="color: #ffffff; margin-bottom: 8px;">Reset Your Password</h2>
          <p style="color: #aaa; margin-bottom: 24px;">Hi ${userName}, we received a request to reset your SpecSmart password.</p>
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

    console.log(`✅ Password reset email sent to ${trimmedEmail}`);
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
  }
});

// ─── Reset password ───────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({ error: 'Token and new password are required' });

    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const result = await pool.query(
      `SELECT prt.*, u.email
       FROM password_reset_tokens prt
       JOIN users u ON CAST(u.id AS TEXT) = prt.user_id
       WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });

    const resetRecord = result.rows[0];

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      resetRecord.user_id,
      { password: newPassword }
    );

    if (updateError)
      return res.status(400).json({ error: 'Failed to reset password. Please try again.' });

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

// ─── Verify reset token ───────────────────────────────────────────────────────
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
router.post('/logout', authenticateToken, async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;