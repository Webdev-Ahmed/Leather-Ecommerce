import { create } from 'zustand'
import type { User } from '@/types/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthState = {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean
}

type AuthActions = {
  login: (token: string, user: User) => void
  logout: () => void
  setTokens: (token: string) => void
  setUser: (user: User) => void
}

type AuthStore = AuthState & AuthActions

// ─── Store ────────────────────────────────────────────────────────────────────

// accessToken is intentionally NOT persisted — it lives in memory only.
// The httpOnly refreshToken cookie is what survives page refresh.
// On reload the Axios interceptor will call POST /auth/refresh automatically
// when the first authenticated request returns a 401.
export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,

  login: (token, user) =>
    set({ accessToken: token, user, isAuthenticated: true }),

  logout: () =>
    set({ accessToken: null, user: null, isAuthenticated: false }),

  setTokens: (token) =>
    set({ accessToken: token, isAuthenticated: true }),

  setUser: (user) => set({ user }),
}))
