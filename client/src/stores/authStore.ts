import { create } from 'zustand';
import { supabase, getCurrentUser, signInWithGoogle, signOut as supabaseSignOut, onAuthStateChange } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthState {
  user: SupabaseUser | null;
  session: Session | null; // Store session information if needed
  isAuthenticated: boolean;
  isLoading: boolean; // True while checking initial session or during login/logout
  error: string | null; // To store any auth-related errors

  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  // checkUserSession: () => Promise<void>; // Keep or remove based on final setup
  _setUserSession: (user: SupabaseUser | null, session: Session | null) => void; // Internal helper
  _setLoading: (loading: boolean) => void;
  _setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Initial state
  set({ user: null, session: null, isAuthenticated: false, isLoading: true, error: null });

  // Function to update user and session state
  const updateUserSession = (user: SupabaseUser | null, session: Session | null) => {
    set({
      user,
      session,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    });
  };

  // Call onAuthStateChange to subscribe to auth changes
  // This will handle initial user check and subsequent changes
  const { data: authListener } = onAuthStateChange((event, session) => {
    console.log('Auth event:', event, session);
    const currentUser = session?.user || null;
    updateUserSession(currentUser, session);

    // Handle specific events if needed
    if (event === 'SIGNED_IN') {
      // Additional actions on sign-in
    } else if (event === 'SIGNED_OUT') {
      // Additional actions on sign-out
      set({ user: null, session: null, isAuthenticated: false });
    } else if (event === 'USER_UPDATED') {
      set({ user: session?.user || null });
    } else if (event === 'PASSWORD_RECOVERY') {
        // Handle password recovery state if UI for it exists
    } else if (event === 'TOKEN_REFRESHED') {
        // Session token has been refreshed
        set({ session });
    }
  });

  // Initial check, though onAuthStateChange should cover it.
  // This ensures isLoading is set to false after the first check.
  // Could be redundant if onAuthStateChange fires immediately on load.
  getCurrentUser()
    .then(({ user, session, error }) => {
      if (error && error.message !== "Supabase not configured") { // Ignore "not configured" as it's handled by supabase.ts
        set({ error: error.message, isLoading: false });
      } else if (user) {
        updateUserSession(user, session);
      } else {
        set({ isLoading: false }); // No user, not loading
      }
    })
    .catch(err => {
      console.error("Error in initial getCurrentUser:", err);
      set({ error: err.message, isLoading: false });
    });


  return {
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    loginWithGoogle: async () => {
      set({ isLoading: true, error: null });
      const { error } = await signInWithGoogle();
      if (error) {
        console.error("Error logging in with Google:", error.message);
        set({ error: error.message, isLoading: false });
        // The onAuthStateChange listener will handle setting user if successful
      }
      // isLoading will be set to false by onAuthStateChange after redirect and callback
    },

    logout: async () => {
      set({ isLoading: true, error: null });
      const { error } = await supabaseSignOut(); // aliased to avoid conflict
      if (error) {
        console.error("Error logging out:", error.message);
        set({ error: error.message, isLoading: false });
      } else {
        // onAuthStateChange will handle setting user to null
        set({ user: null, session: null, isAuthenticated: false }); // Explicitly clear for immediate UI update
      }
      set({ isLoading: false });
    },

    // Internal helper to allow direct state updates if needed from outside (e.g., testing, specific scenarios)
    _setUserSession: (user, session) => updateUserSession(user,session),
    _setLoading: (loading) => set({ isLoading: loading }),
    _setError: (error) => set({ error }),

    // Cleanup listener on unmount (though Zustand stores are global, this is good practice if re-instantiation was possible)
    // For a global store, this might not be strictly necessary unless the app can fully "unload" the store.
    // In most SPAs, the store lives as long as the app.
    // If you had multiple instances or a way to destroy the store, you'd call:
    // () => { authListener?.subscription.unsubscribe(); }
  };
});

// Optional: To trigger initial user check if onAuthStateChange doesn't fire immediately or for SSR.
// However, for client-side, onAuthStateChange is generally sufficient.
// useAuthStore.getState().checkUserSession(); // Not strictly needed due to onAuthStateChange and direct call above.

// Log store changes for debugging (optional)
// useAuthStore.subscribe(state => console.log('AuthStore changed:', state));
