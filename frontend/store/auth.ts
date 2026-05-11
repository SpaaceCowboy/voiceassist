import { create } from "zustand";

const TOKEN_KEY = "auth-token";

export type Role = "admin" | "moderator" | "user";

export type AuthUser = {
  id?: string;
  email: string;
  role: Role;
};

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  hydrated: boolean;
  setUser: (u: AuthUser | null) => void;
  setToken: (t: string | null) => void;
  setLoading: (v: boolean) => void;
  hydrate: () => void;
  logoutLocal: () => void;
};

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export const useAuthStore = create<AuthState>((set: (partial: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>)) => void) => ({
  user: null,
  token: null,
  loading: true,
  hydrated: false,

  setUser: (u: AuthUser | null) => set({ user: u }),
  setToken: (t: string | null) => set({ token: t }),

  setLoading: (v: boolean) => set({ loading: v }),

  hydrate: () => {
    const token = getStoredToken();
    set({
      token: token ?? null,
      hydrated: true,
      loading: false,
    });
  },

  logoutLocal: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      document.cookie = "auth-token=; path=/; max-age=0; SameSite=Lax";
    }
    set({ user: null, token: null });
  },
}));
