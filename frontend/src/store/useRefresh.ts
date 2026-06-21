import { create } from 'zustand'

interface RefreshState {
  nonce: number
  bump: () => void
}

/** Global "refresh all widgets" signal — widgets re-fetch when nonce changes. */
export const useRefresh = create<RefreshState>((set) => ({
  nonce: 0,
  bump: () => set((s) => ({ nonce: s.nonce + 1 })),
}))
