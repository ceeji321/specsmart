import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import managerRoutes from './routes/manager.js';
import userRoutes from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 5000;

console.log('\n🔧 Server Configuration:');
console.log('📍 Port:', PORT);
console.log('🌐 Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:5173');
console.log('⚡ Groq API Key:', process.env.GROQ_API_KEY ? '✅ Loaded' : '❌ NOT FOUND');
console.log('🧠 Image AI: TensorFlow.js MobileNet (runs FREE in browser)');
console.log('💾 Database:', process.env.DB_NAME || 'Not configured');
console.log('🔐 JWT Secret:', process.env.JWT_SECRET ? '✅ Configured' : '❌ NOT FOUND');
console.log('');

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://specsmart-n2jd.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    groqApiKey: process.env.GROQ_API_KEY ? 'configured' : 'missing',
    imageAI: 'TensorFlow.js MobileNet v2 (browser-side, free)'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/ai/chat  (⚡ Groq LLaMA + 🧠 TF.js MobileNet)`);
  console.log(`   - GET  /api/health`);
  console.log('');
});

export default app;