/** Symbols streamed in the live ticker (mirrors the backend poller list). */
export const TICKER_SYMBOLS = [
  'XAU=F',
  'XAG=F',
  'EURUSD=X',
  'GBPUSD=X',
  'USDJPY=X',
  'USDCHF=X',
  'AUDUSD=X',
  'USDCAD=X',
  'DX-Y.NYB',
  'BTC-USD',
  'GC=F',
  'CL=F',
  '^GSPC',
] as const

/** Human-friendly labels for symbols. */
export const SYMBOL_LABELS: Record<string, string> = {
  'XAU=F': 'XAU/USD',
  'XAG=F': 'XAG/USD',
  'EURUSD=X': 'EUR/USD',
  'GBPUSD=X': 'GBP/USD',
  'USDJPY=X': 'USD/JPY',
  'USDCHF=X': 'USD/CHF',
  'AUDUSD=X': 'AUD/USD',
  'USDCAD=X': 'USD/CAD',
  'DX-Y.NYB': 'DXY',
  'BTC-USD': 'BTC/USD',
  'GC=F': 'Gold Fut',
  'CL=F': 'WTI Oil',
  '^GSPC': 'S&P 500',
}

export function symbolLabel(symbol: string): string {
  return SYMBOL_LABELS[symbol] ?? symbol
}
