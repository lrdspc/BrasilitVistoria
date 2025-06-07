import { createClient, Session, User, SupabaseClient } from '@supabase/supabase-js';

// Placeholder constants for Supabase URL and Anon Key.
// In a real environment, these should be loaded from environment variables:
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const SUPABASE_URL_PLACEHOLDER = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY_PLACEHOLDER = 'YOUR_SUPABASE_ANON_KEY';

// Attempt to get actual values from Vite environment variables
const envSupabaseUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
const envSupabaseAnonKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;

const supabaseUrl = envSupabaseUrl || SUPABASE_URL_PLACEHOLDER;
const supabaseAnonKey = envSupabaseAnonKey || SUPABASE_ANON_KEY_PLACEHOLDER;

let supabase: SupabaseClient;

// Check to prevent usage with placeholder values.
if (supabaseUrl === SUPABASE_URL_PLACEHOLDER || supabaseUrl === undefined || supabaseUrl.trim() === "" ||
    supabaseAnonKey === SUPABASE_ANON_KEY_PLACEHOLDER || supabaseAnonKey === undefined || supabaseAnonKey.trim() === "") {

  const errorMessage =
    'Supabase URL or Anon Key is not configured or using placeholder values. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables, ' +
    'or update placeholder values in client/src/lib/supabase.ts for development (not recommended for production).';

  console.error(errorMessage);
  // Provide a mock Supabase client so the rest of the app doesn't break on import if it expects supabase.auth
  supabase = {
    auth: {
      signInWithOAuth: () => {
        console.error(errorMessage);
        return Promise.resolve({ data: null, error: { message: "Supabase not configured" } });
      },
      signOut: () => {
        console.error(errorMessage);
        return Promise.resolve({ error: { message: "Supabase not configured" } });
      },
      getUser: () => {
        console.error(errorMessage);
        return Promise.resolve({ data: { user: null }, error: { message: "Supabase not configured" } });
      },
      getSession: () => {
        console.error(errorMessage);
        return Promise.resolve({ data: { session: null }, error: { message: "Supabase not configured" } });
      },
      onAuthStateChange: (_callback: (event: string, session: Session | null) => void) => {
        console.error(errorMessage);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    }
    // Add other Supabase services mocks if needed (e.g., from, storage)
  } as unknown as SupabaseClient; // Cast to SupabaseClient to satisfy type checks elsewhere
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Signs in the user with Google OAuth.
 * Redirects to the dashboard upon successful authentication.
 */
export const signInWithGoogle = async () => {
  let redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '';
  if (typeof window !== 'undefined' && (!window.location.origin || window.location.origin === "null")) {
      // Handle specific cases like Capacitor where origin might be "null" or missing
      // You might need a default production URL or specific configuration for these environments
      console.warn("window.location.origin is null or undefined. Falling back to default redirect. This might fail in some environments.");
      redirectTo = 'http://localhost:5173/dashboard'; // Fallback for local dev if origin is weird. Adjust as needed.
  }
  if (!redirectTo) {
    const errorMsg = "Failed to determine redirect URL for OAuth. Ensure window.location.origin is available or provide a fallback.";
    console.error(errorMsg);
    return { data: null, error: { message: errorMsg } };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo,
    },
  });

  if (error) {
    console.error('Error during Google sign-in:', error.message);
  }
  return { data, error };
};

/**
 * Signs out the current user.
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error during sign out:', error.message);
  }
  return { error };
};

/**
 * Gets the current authenticated user and session.
 * @returns An object containing the user data, session, and any error.
 */
export const getCurrentUser = async (): Promise<{ user: User | null; session: Session | null; error: any | null }> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (userError) console.error('Error fetching user:', userError.message);
  if (sessionError) console.error('Error fetching session:', sessionError.message);

  // Return the first error encountered, or null if none
  const error = userError || sessionError || null;

  return { user, session, error };
};

/**
 * Listens to authentication state changes.
 * @param callback - Function to be called when auth state changes.
 * @returns Subscription object.
 */
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

export { supabase }; // Export the client instance
