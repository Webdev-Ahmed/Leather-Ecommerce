import { create } from "zustand";
import type { User } from "@/types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthState = {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
};

type AuthActions = {
  login: (token: string, user: User) => void;
  logout: () => void;
  setTokens: (token: string) => void;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setAuthLoading: (value: boolean) => void;
};

type AuthStore = AuthState & AuthActions;

// ─── Store ────────────────────────────────────────────────────────────────────

// accessToken is intentionally NOT persisted — it lives in memory only.
// The httpOnly refreshToken cookie is what survives page refresh.
// On reload the Axios interceptor will call POST /auth/refresh automatically
// when the first authenticated request returns a 401.
export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,

  login: (token, user) =>
    set({
      accessToken: token,
      user,
      isAuthenticated: true,
      isAuthLoading: false,
    }),

  logout: () =>
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isAuthLoading: false,
    }),

  setTokens: (token) =>
    set((state) => ({
      accessToken: token,
      isAuthenticated: state.user ? true : state.isAuthenticated,
    })),

  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: user
        ? true
        : state.accessToken
          ? state.isAuthenticated
          : false,
    })),

  setAuthenticated: (value) => set({ isAuthenticated: value }),

  setAuthLoading: (value) => set({ isAuthLoading: value }),
}));
