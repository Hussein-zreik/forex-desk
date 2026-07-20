import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, setAuthToken } from '@/lib/api'

export interface User {
  id: string
  email: string
  theme: string
  email_verified?: boolean
  totp_enabled?: boolean
}

/** Resolved login: either signed in, or the server wants a 2FA code first. */
export interface LoginResult {
  totpRequired: boolean
  challengeToken?: string
}

interface AuthState {
  token: string | null
  user: User | null
  login: (email: string, password: string) => Promise<LoginResult>
  verifyTotp: (challengeToken: string, code: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  logoutEverywhere: () => Promise<void>
  loadMe: () => Promise<void>
}

interface TokenResponse {
  access_token: string
}

interface LoginResponse {
  access_token?: string
  totp_required?: boolean
  challenge_token?: string
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      async login(email, password) {
        const res = await api<LoginResponse>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        if (res.totp_required && res.challenge_token) {
          return { totpRequired: true, challengeToken: res.challenge_token }
        }
        const access = res.access_token
        if (!access) throw new Error('Login failed — no token returned')
        setAuthToken(access)
        set({ token: access })
        await get().loadMe()
        return { totpRequired: false }
      },

      async verifyTotp(challengeToken, code) {
        const { access_token } = await api<TokenResponse>('/api/auth/totp/verify', {
          method: 'POST',
          body: JSON.stringify({ challenge_token: challengeToken, code }),
        })
        setAuthToken(access_token)
        set({ token: access_token })
        await get().loadMe()
      },

      async register(email, password) {
        const { access_token } = await api<TokenResponse>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setAuthToken(access_token)
        set({ token: access_token })
        await get().loadMe()
      },

      logout() {
        setAuthToken(null)
        set({ token: null, user: null })
      },

      // Invalidate every other session; the server returns a fresh token so
      // this device stays signed in.
      async logoutEverywhere() {
        const { access_token } = await api<TokenResponse>('/api/auth/logout-all', {
          method: 'POST',
        })
        setAuthToken(access_token)
        set({ token: access_token })
      },

      async loadMe() {
        const user = await api<User>('/api/auth/me')
        set({ user })
      },
    }),
    {
      name: 'fxdesk_auth',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token)
      },
    },
  ),
)
