import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Access token required' });
  }

  supabase.auth.getUser(token).then(({ data: { user }, error }) => {
    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      userId: user.id,
      id:     user.id,
      email:  user.email,
      role:   user.user_metadata?.role || 'user',
    };

    next();
  });
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token || token === 'null' || token === 'undefined') {
    req.user = null;
    return next();
  }

  supabase.auth.getUser(token).then(({ data: { user }, error }) => {
    if (!error && user) {
      req.user = {
        userId: user.id,
        id:     user.id,
        email:  user.email,
        role:   user.user_metadata?.role || 'user',
      };
    } else {
      req.user = null;
    }
    next();
  });
}

export function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}