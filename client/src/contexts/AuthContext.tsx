import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { offlineStorage } from '@/lib/storage';

interface AuthUser extends User {
  profile?: {
    name: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signInWithGoogle: () => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  isOfflineMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    // Initialize auth state
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const authUser: AuthUser = {
            ...session.user,
            profile: {
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            },
          };
          setUser(authUser);
          setIsOfflineMode(false);
          
          // Save user session for offline use
          await offlineStorage.saveSetting('lastUser', {
            id: authUser.id,
            email: authUser.email,
            name: authUser.profile?.name,
            lastLoginAt: new Date().toISOString(),
          });
        } else {
          await handleOfflineAuth();
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const authUser: AuthUser = {
          ...session.user,
          profile: {
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          },
        };
        setUser(authUser);
      } else {
        await handleOfflineAuth();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await handleOfflineAuth();
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineAuth = async () => {
    // Check for offline user session
    try {
      const lastUser = await offlineStorage.getSetting('lastUser');
      if (lastUser && isWithinOfflineWindow(lastUser.lastLoginAt)) {
        const offlineUser: AuthUser = {
          id: lastUser.id,
          email: lastUser.email,
          user_metadata: { name: lastUser.name },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          profile: { name: lastUser.name },
        } as AuthUser;
        
        setUser(offlineUser);
        setIsOfflineMode(true);
        console.log('🔒 Using offline authentication');
      } else {
        setUser(null);
        setIsOfflineMode(false);
      }
    } catch (error) {
      console.error('Offline auth error:', error);
      setUser(null);
      setIsOfflineMode(false);
    }
  };

  const isWithinOfflineWindow = (lastLoginAt: string): boolean => {
    const lastLogin = new Date(lastLoginAt);
    const now = new Date();
    const diffHours = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
    return diffHours < 72; // 72 hours offline window
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Try offline authentication as fallback
        const lastUser = await offlineStorage.getSetting('lastUser');
        if (lastUser && lastUser.email === email && isWithinOfflineWindow(lastUser.lastLoginAt)) {
          await handleOfflineAuth();
          return { error: null };
        }
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsOfflineMode(false);
      
      // Clear offline session
      await offlineStorage.saveSetting('lastUser', null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Force local signout even if remote fails
      setUser(null);
      setIsOfflineMode(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signInWithGoogle,
    signOut,
    isOfflineMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
