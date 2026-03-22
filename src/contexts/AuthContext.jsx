// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://specsmart-production-ed74.up.railway.app';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export function AuthProvider({ children }) {
  const [user,     setUser]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  // ✅ FIX: Store DB username separately — always fetched fresh from your database
  const [dbUsername, setDbUsername] = useState('');

  // ── Global axios interceptor ──────────────────────────────────────────────
  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      response => response,
      async error => {
        const code = error.response?.data?.code;
        if (
          error.response?.status === 403 &&
          (code === 'ACCOUNT_ARCHIVED' || code === 'ACCOUNT_DISABLED')
        ) {
          await supabase.auth.signOut();
          setUser(null);
          setDbUsername('');
          delete axios.defaults.headers.common['Authorization'];
          const msg = code === 'ACCOUNT_ARCHIVED'
            ? 'Your account has been archived. Please contact support.'
            : 'Your account has been disabled. Please contact support.';
          alert(msg);
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptorId);
  }, []);

  // ✅ FIX: Fetch fresh username from YOUR database — not Supabase metadata
  // This ensures web always shows the same name as the app
  const fetchDbUsername = async (accessToken) => {
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
          'Content-Type'  : 'application/json',
          'Authorization' : `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        // ✅ Prefer username (what Android updates) over name
        const freshName = data.user?.username || data.user?.name || '';
        if (freshName) setDbUsername(freshName);
      }
    } catch (e) {
      // Non-fatal — fallback to metadata
    }
  };

  const refreshUser = async (accessToken) => {
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser) {
      setUser(freshUser);
      if (accessToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        // ✅ Always fetch fresh username from DB on session refresh
        await fetchDbUsername(accessToken);
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        refreshUser(session.access_token);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        refreshUser(session.access_token);
      } else {
        setUser(null);
        setDbUsername('');
        delete axios.defaults.headers.common['Authorization'];
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async ({ email, password, name }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, username: email.split('@')[0] } }
      });
      if (error) return { success: false, error: error.message };
      if (data.session) return { success: true, user: data.user };
      return { success: true, user: data.user, message: 'Check your email to confirm your account!' };
    } catch (e) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const login = async (email, password) => {
    try {
      await axios.post(`${API_URL}/api/auth/login`, { email, password });

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login credentials'))
          return { success: false, error: 'Invalid email or password' };
        return { success: false, error: error.message };
      }

      const token = data.session.access_token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (_) { }

      // ✅ Fetch fresh DB username right after login
      await fetchDbUsername(token);

      return { success: true, user: data.user };
    } catch (e) {
      const serverError = e.response?.data?.error;
      if (e.response?.status === 403 && serverError)
        return { success: false, error: serverError };
      if (e.response?.status === 401)
        return { success: false, error: 'Invalid email or password' };
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const logout = async () => {
    setDbUsername('');
    await supabase.auth.signOut();
  };

  const updateUser = async (userData) => {
    const { data, error } = await supabase.auth.updateUser({ data: userData });
    if (!error && data.user) setUser(data.user);
    // ✅ Also update dbUsername immediately so navbar reflects change
    if (userData.name || userData.username) {
      setDbUsername(userData.username || userData.name || dbUsername);
    }
    return { success: !error, error: error?.message };
  };

  const role = user?.user_metadata?.role || user?.app_metadata?.role || 'user';

  const value = {
    user,
    loading,
    supabase,
    isAuthenticated : !!user,
    isAdmin         : role === 'admin',
    isManager       : ['manager', 'admin'].includes(role),
    // ✅ FIX: userName now reads from DB first, falls back to Supabase metadata
    // This means web always shows the same name as the Android app
    userName  : dbUsername || user?.user_metadata?.name || user?.email?.split('@')[0] || '',
    userEmail : user?.email || '',
    register,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}