// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Always fetch fresh user from Supabase to get latest metadata/role ────────
  const refreshUser = async (accessToken) => {
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser) {
      setUser(freshUser);
      if (accessToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }
    }
  };

  useEffect(() => {
    // Get session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        refreshUser(session.access_token);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        refreshUser(session.access_token);
      } else {
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Register ─────────────────────────────────────────────────────────────────
  // NOTE: Do NOT set role here — role is always managed server-side via Supabase admin
  const register = async ({ email, password, name }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            username: email.split('@')[0],
            // role is intentionally NOT set here — defaults to 'user' on the server
          }
        }
      });

      if (error) return { success: false, error: error.message };

      if (data.session) return { success: true, user: data.user };

      return {
        success: true,
        user: data.user,
        message: 'Check your email to confirm your account!'
      };
    } catch (e) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  // ─── Login ────────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials'))
          return { success: false, error: 'Invalid email or password' };
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (e) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  // ─── Logout ───────────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
  };

  // ─── Update user metadata ─────────────────────────────────────────────────────
  const updateUser = async (userData) => {
    const { data, error } = await supabase.auth.updateUser({ data: userData });
    if (!error && data.user) setUser(data.user);
    return { success: !error, error: error?.message };
  };

  // Read role — check both user_metadata and app_metadata for safety
  const role = user?.user_metadata?.role || user?.app_metadata?.role || 'user';

  const value = {
    user,
    loading,
    supabase,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isManager: ['manager', 'admin'].includes(role),
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