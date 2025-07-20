import { create } from 'zustand';
import type { UserWithAnonymous } from 'better-auth/plugins';


interface AuthState {
  user: UserWithAnonymous | null;
  setUser: (user: UserWithAnonymous | null) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  isAuthenticated: () => !!get().user,
}));