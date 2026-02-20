// resetAdmin.js — Run once to fix the admin password
// Usage: node resetAdmin.js

import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'specsmart',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123',
});

const ADMIN_EMAIL = 'admin@specsmart.com';
const ADMIN_PASSWORD = 'admin123'; // ← Change this to whatever you want to use

async function resetAdminPassword() {
  try {
    console.log('🔄 Connecting to database...');

    // Check if admin user exists
    const check = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    if (check.rows.length === 0) {
      // Admin doesn't exist — create them
      console.log('👤 Admin user not found. Creating...');
      await pool.query(
        `INSERT INTO users (email, password, name, role, created_at)
         VALUES ($1, $2, $3, 'admin', NOW())`,
        [ADMIN_EMAIL, hash, 'Admin']
      );
      console.log('✅ Admin user CREATED successfully!');
    } else {
      // Admin exists — update password
      console.log('👤 Admin user found. Resetting password...');
      await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hash, ADMIN_EMAIL]
      );
      console.log('✅ Admin password RESET successfully!');
    }

    console.log('');
    console.log('📋 Login credentials:');
    console.log('   Email:   ', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('');
    console.log('🎉 Done! You can now log in at http://localhost:5173');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Make sure PostgreSQL is running and your .env is correct');
  } finally {
    await pool.end();
    process.exit();
  }
}

resetAdminPassword();