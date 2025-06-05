import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@shared/schema';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  login: (user: User, token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),

      setToken: (token) => set({ token }),

      setLoading: (isLoading) => set({ isLoading }),

      login: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true,
        isLoading: false 
      }),

      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        isLoading: false 
      }),
    }),
    {
      name: 'vigitel-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
