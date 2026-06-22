import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface SettingsState {
  theme: Theme
  soundEnabled: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleSound: () => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      soundEnabled: true,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      toggleSound: () => set({ soundEnabled: !get().soundEnabled }),
    }),
    { name: 'fxdesk_settings' },
  ),
)
