import { create } from 'zustand'
import { api } from '@/lib/api'
import { TICKER_SYMBOLS } from '@/lib/symbols'

export interface CatalogEntry {
  symbol: string
  label: string
}

interface WatchlistResponse {
  symbols: string[]
  catalog: CatalogEntry[]
}

interface WatchlistState {
  /** Effective watchlist (server-backed; defaults until loaded/logged out). */
  symbols: string[]
  catalog: CatalogEntry[]
  loaded: boolean
  load: () => Promise<void>
  save: (symbols: string[]) => Promise<void>
}

const DEFAULT_SYMBOLS = [...TICKER_SYMBOLS]

export const useWatchlist = create<WatchlistState>()((set, get) => ({
  symbols: DEFAULT_SYMBOLS,
  catalog: [],
  loaded: false,

  async load() {
    if (get().loaded) return
    try {
      const res = await api<WatchlistResponse>('/api/watchlist')
      // Defensive: a degraded/unexpected payload must never blank the ticker.
      if (Array.isArray(res?.symbols) && res.symbols.length > 0) {
        set({
          symbols: res.symbols,
          catalog: Array.isArray(res.catalog) ? res.catalog : [],
          loaded: true,
        })
      }
    } catch {
      // Logged out or transient — defaults stay in place.
    }
  },

  async save(symbols) {
    if (symbols.length === 0) return // never persist an empty watchlist
    const prev = get().symbols
    set({ symbols }) // optimistic — the ticker reorders immediately
    try {
      const res = await api<WatchlistResponse>('/api/watchlist', {
        method: 'PUT',
        body: JSON.stringify({ symbols }),
      })
      if (Array.isArray(res?.symbols) && res.symbols.length > 0) {
        set({ symbols: res.symbols, catalog: Array.isArray(res.catalog) ? res.catalog : get().catalog })
      }
    } catch {
      set({ symbols: prev })
    }
  },
}))
