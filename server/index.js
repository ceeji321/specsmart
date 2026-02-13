import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route — serves a simple landing so localhost:5000 doesn't 404
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SpecSmart API',
    version: '1.0.0',
    endpoints: [
      'GET  /api/health',
      'GET  /api/devices',
      'POST /api/auth/login',
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SpecSmart API is running',
    timestamp: new Date().toISOString()
  });
});

// Test routes
app.get('/api/devices', (req, res) => {
  res.json({ message: 'Devices endpoint', devices: [] });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login endpoint', body: req.body });
});

// 404 handler — Express 5 requires 4-param signature for next, but for
// a catch-all without next we just use (req, res)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler — Express 5 still needs the 4-param signature
app.use((err, req, res, next) => {  // eslint-disable-line no-unused-vars
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});