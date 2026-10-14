import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../services/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiveSupabase, setIsLiveSupabase] = useState(isSupabaseConfigured());

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const session = await authService.getSession();
        if (mounted) {
          setUser(session?.user || null);
          setIsLiveSupabase(authService.isConfigured());
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const unsubscribe = authService.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user || null);
        setIsLiveSupabase(authService.isConfigured());
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const signIn = async (credentials) => {
    const data = await authService.signIn(credentials);
    setUser(data.user);
    return data;
  };

  const signUp = async (credentials) => {
    const data = await authService.signUp(credentials);
    setUser(data.user);
    return data;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const loginAsDemo = async () => {
    const demoUser = {
      id: 'demo-user-uuid-1234',
      email: 'strawberry.manager@trade.mm',
      user_metadata: {
        business_name: 'Maymyo Strawberry Orchard & Trading',
      },
    };
    setUser(demoUser);
    return demoUser;
  };

  const value = {
    user,
    loading,
    isLiveSupabase,
    isDemoMode: !isLiveSupabase,
    signIn,
    signUp,
    signOut,
    loginAsDemo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
