import { supabase, isSupabaseConfigured } from './supabaseClient';
import { localStore } from './localStore';

export const authService = {
  isConfigured() {
    return isSupabaseConfigured();
  },

  async getSession() {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } else {
      const user = localStore.getUser();
      return user ? { user } : null;
    }
  },

  async signUp({ email, password, businessName }) {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName || 'Strawberry Farm & Trading',
          },
        },
      });
      if (error) throw error;
      return data;
    } else {
      // Local demo mode sign up
      const demoUser = {
        id: 'usr-' + Date.now(),
        email: email || 'farmer@strawberrytrade.com',
        user_metadata: {
          business_name: businessName || 'Strawberry Farm & Trading',
        },
      };
      localStore.setUser(demoUser);
      return { user: demoUser, session: { user: demoUser } };
    }
  },

  async signIn({ email, password }) {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } else {
      // Local demo login
      let user = localStore.getUser();
      if (!user) {
        user = {
          id: 'demo-user-uuid-1234',
          email: email || 'farmer@strawberrytrade.com',
          user_metadata: {
            business_name: 'Maymyo Strawberry Orchard & Trading',
          },
        };
        localStore.setUser(user);
      }
      return { user, session: { user } };
    }
  },

  async signOut() {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      localStore.setUser(null);
    }
  },

  onAuthStateChange(callback) {
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
      return () => subscription.unsubscribe();
    } else {
      // For demo mode, emit initial session
      const user = localStore.getUser();
      callback('INITIAL', user ? { user } : null);
      return () => {};
    }
  },
};
