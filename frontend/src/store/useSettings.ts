import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'
export type ClockDisplay = 'local' | 'utc'
export type SoundPattern = 'chime' | 'pulse' | 'beep'

interface SettingsState {
  theme: Theme
  soundEnabled: boolean
  soundPattern: SoundPattern
  clockDisplay: ClockDisplay
  /** Anonymous error reports (Sentry). Applies from the next page load. */
  shareErrorReports: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleSound: () => void
  setSoundPattern: (pattern: SoundPattern) => void
  setClockDisplay: (display: ClockDisplay) => void
  setShareErrorReports: (share: boolean) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      soundEnabled: true,
      soundPattern: 'chime',
      clockDisplay: 'local',
      shareErrorReports: true,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      toggleSound: () => set({ soundEnabled: !get().soundEnabled }),
      setSoundPattern: (soundPattern) => set({ soundPattern }),
      setClockDisplay: (clockDisplay) => set({ clockDisplay }),
      setShareErrorReports: (shareErrorReports) => set({ shareErrorReports }),
    }),
    { name: 'fxdesk_settings' },
  ),
)
