// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const API_URL = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://specsmart-production.up.railway.app';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
      }
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Register ────────────────────────────────────────────────────────────────
  const register = async ({ email, password, name }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            username: email.split('@')[0],
            role: 'user'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If email confirmation is disabled in Supabase, user is logged in immediately
      if (data.session) {
        return { success: true, user: data.user };
      }

      // If email confirmation is enabled
      return {
        success: true,
        user: data.user,
        message: 'Check your email to confirm your account!'
      };

    } catch (e) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  // ─── Login ───────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Invalid email or password' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };

    } catch (e) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
  };

  // ─── Update user metadata ─────────────────────────────────────────────────────
  const updateUser = async (userData) => {
    const { data, error } = await supabase.auth.updateUser({
      data: userData
    });
    if (!error && data.user) {
      setUser(data.user);
    }
    return { success: !error, error: error?.message };
  };

  const value = {
    user,
    loading,
    supabase, // expose supabase client in case other components need it
    isAuthenticated: !!user,
    isAdmin: user?.user_metadata?.role === 'admin',
    isManager: ['manager', 'admin'].includes(user?.user_metadata?.role),
    // Convenience getters matching old shape
    userName: user?.user_metadata?.name || user?.email?.split('@')[0] || '',
    userEmail: user?.email || '',
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
};