import { create } from 'zustand'

export interface Quote {
  symbol: string
  price: number | null
  previousClose?: number | null
  change: number | null
  changePercent: number | null
  currency?: string | null
  /** Optional detail fields — rendered when the API provides them. */
  dayHigh?: number | null
  dayLow?: number | null
  bid?: number | null
  ask?: number | null
  open?: number | null
  error?: string
}

interface MarketState {
  quotes: Record<string, Quote>
  upsertQuotes: (quotes: Quote[]) => void
}

export const useMarketData = create<MarketState>((set) => ({
  quotes: {},
  upsertQuotes: (incoming) =>
    set((state) => {
      const next = { ...state.quotes }
      for (const quote of incoming) {
        if (quote && quote.symbol) next[quote.symbol] = quote
      }
      return { quotes: next }
    }),
}))
