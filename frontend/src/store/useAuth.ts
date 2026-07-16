import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, setAuthToken } from '@/lib/api'

export interface User {
  id: string
  email: string
  theme: string
  email_verified?: boolean
}

interface AuthState {
  token: string | null
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  loadMe: () => Promise<void>
}

interface TokenResponse {
  access_token: string
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      async login(email, password) {
        const { access_token } = await api<TokenResponse>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
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
