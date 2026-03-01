import pg from 'pg';
import bcrypt from 'bcrypt';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:UHIQczOQxqAyRHxHLAWHMGuZmcnBXzep@turntable.proxy.rlwy.net:52173/railway',
  ssl: { rejectUnauthorized: false }
});

async function resetPassword() {
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(`UPDATE users SET password = $1 WHERE email = 'cjcendana@gmail.com'`, [hash]);
  console.log('✅ Password reset to admin123!');
  await pool.end();
}

resetPassword().catch(console.error);