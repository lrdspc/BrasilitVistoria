import { useAuthStore } from '@/stores/authStore';
import type { User as SupabaseUser } from '@supabase/supabase-js'; // Import Supabase User type

/**
 * Custom hook to access authentication state and actions.
 * This hook serves as a convenient wrapper around the useAuthStore,
 * providing a clean interface for components to interact with authentication.
 */
export function useAuth() {
  const {
    user,
    session,
    isAuthenticated,
    isLoading,
    error,
    loginWithGoogle,
    logout,
  } = useAuthStore(state => ({
    user: state.user,
    session: state.session,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    loginWithGoogle: state.loginWithGoogle,
    logout: state.logout,
  }));

  // The user object from Supabase might have a different structure than the previous custom User type.
  // If other parts of the app expect the old User structure, a mapping function might be needed here.
  // For now, we return the SupabaseUser object directly.
  // Example of adapting Supabase user to the old structure if needed:
  // const appUser = user ? mapSupabaseUserToAppUser(user) : null;

  return {
    user: user as SupabaseUser | null, // Explicitly type the user being returned
    session,
    isAuthenticated,
    isLoading, // Reflects auth state checking
    isLoggingIn: isLoading, // Can use isLoading directly or have specific login loading state if preferred
    error,

    loginWithGoogle, // Action from the store
    logout,          // Action from the store

    // Deprecated/mock functions from old hook - remove or adapt if Supabase provides equivalents
    // login: async (email, password) => { console.warn("Email/password login not implemented with Supabase yet via useAuth"); },
    // register: async (userData) => { console.warn("Registration not implemented with Supabase yet via useAuth"); },
    // isRegistering: false, // Placeholder
  };
}

// Example mapping function if needed by other parts of the application
// that expect the old User schema defined in @shared/schema
// import type { User as AppUserSchema } from '@shared/schema';
// const mapSupabaseUserToAppUser = (supabaseUser: SupabaseUser): AppUserSchema => {
//   return {
//     id: supabaseUser.id, // Supabase user ID is a string (UUID)
//     email: supabaseUser.email || '',
//     name: supabaseUser.user_metadata?.name || supabaseUser.email || 'Usuário', // Example: get name from metadata
//     // These fields are custom and would need to be stored in Supabase user_metadata or a separate 'profiles' table
//     department: supabaseUser.user_metadata?.department || 'N/A',
//     unit: supabaseUser.user_metadata?.unit || 'N/A',
//     coordinator: supabaseUser.user_metadata?.coordinator || 'N/A',
//     manager: supabaseUser.user_metadata?.manager || 'N/A',
//     regional: supabaseUser.user_metadata?.regional || 'N/A',
//   };
// };

// Note: The old useAuth.ts had its own state management, local storage interaction,
// and API calls. This refactored version delegates all of that to useAuthStore,
// which now uses Supabase for authentication.
// The specific fields like 'department', 'unit', etc., previously in the User type
// are not standard in SupabaseUser. They would typically be stored in `user_metadata`
// or a separate 'profiles' table linked to the auth user.
// The `Header.tsx` component, for example, uses `user.department` and `user.unit`.
// This will require either:
// 1. Updating Header.tsx to use `user.user_metadata.department` (if metadata is structured that way).
// 2. Adjusting the user object in authStore or here in useAuth to include these fields from metadata/profile table.
// For now, this hook will return the Supabase user directly. Components consuming it must adapt.
