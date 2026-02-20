// server/scripts/create-admin.js
// Run with: node server/scripts/create-admin.js

import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const pool = new pg.Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: String(process.env.DB_PASSWORD), // force string — fixes SASL error
});

// ── Change these ──────────────────────────────
const ADMIN_NAME     = 'Admin';
const ADMIN_EMAIL    = 'admin@specsmart.com';
const ADMIN_PASSWORD = 'admin123';
// ─────────────────────────────────────────────

async function createAdmin() {
  const client = await pool.connect();
  try {
    // Check if already exists
    const existing = await client.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [ADMIN_EMAIL.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      const u = existing.rows[0];
      if (u.role === 'admin') {
        console.log(`✅ Admin already exists: ${u.email} (id: ${u.id})`);
      } else {
        // Upgrade existing user to admin
        await client.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', u.id]);
        console.log(`⬆️  Upgraded ${u.email} to admin (id: ${u.id})`);
      }
      return;
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const result = await client.query(
      `INSERT INTO users (email, password, name, role, created_at)
       VALUES ($1, $2, $3, 'admin', NOW())
       RETURNING id, email, name, role`,
      [ADMIN_EMAIL.toLowerCase(), hashed, ADMIN_NAME]
    );

    const admin = result.rows[0];
    console.log('');
    console.log('✅ Admin account created!');
    console.log('──────────────────────────');
    console.log(`   Email    : ${admin.email}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log(`   Role     : ${admin.role}`);
    console.log(`   ID       : ${admin.id}`);
    console.log('──────────────────────────');
    console.log('🔒 Change your password after first login!');
    console.log('');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();