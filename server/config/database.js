import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:UHIQczOQxqAyRHxHLAWHMGuZmcnBXzep@turntable.proxy.rlwy.net:52173/railway',
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('✅ Connected to Railway PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
});

export default pool;