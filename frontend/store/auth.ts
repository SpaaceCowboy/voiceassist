import { create } from "zustand";

export type Role = "admin" | "moderator" | "user";

export type AuthUser = {
  id?: string;
  email: string;
  role: Role;
};

export type AuthState = {
  user: AuthUser | null;
  authenticated: boolean;
  loading: boolean;
  hydrated: boolean;

  setUser: (u: AuthUser | null) => void;
  setAuthenticated: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  hydrate: () => void;
  logoutLocal: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authenticated: false,
  loading: true,
  hydrated: false,

  setUser: (u) => set({ user: u }),

  setAuthenticated: (v) => set({ authenticated: v }),

  setLoading: (v) => set({ loading: v }),

  hydrate: () => {
    set({
      hydrated: true,
      loading: false,
    });
  },

  logoutLocal: () => {
    set({
      user: null,
      authenticated: false,
    });
  },
}));
