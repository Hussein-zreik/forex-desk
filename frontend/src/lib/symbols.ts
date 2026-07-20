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

/** Human-friendly labels for symbols (mirrors backend core/symbols.py catalog). */
export const SYMBOL_LABELS: Record<string, string> = {
  'XAU=F': 'XAU/USD',
  'XAG=F': 'XAG/USD',
  'GC=F': 'Gold Fut',
  'SI=F': 'Silver Fut',
  'EURUSD=X': 'EUR/USD',
  'GBPUSD=X': 'GBP/USD',
  'USDJPY=X': 'USD/JPY',
  'USDCHF=X': 'USD/CHF',
  'AUDUSD=X': 'AUD/USD',
  'USDCAD=X': 'USD/CAD',
  'NZDUSD=X': 'NZD/USD',
  'EURGBP=X': 'EUR/GBP',
  'EURJPY=X': 'EUR/JPY',
  'GBPJPY=X': 'GBP/JPY',
  'AUDJPY=X': 'AUD/JPY',
  'EURCHF=X': 'EUR/CHF',
  'DX-Y.NYB': 'DXY',
  'CL=F': 'WTI Oil',
  'BZ=F': 'Brent Oil',
  'NG=F': 'Nat Gas',
  '^GSPC': 'S&P 500',
  '^NDX': 'Nasdaq 100',
  '^DJI': 'Dow Jones',
  '^FTSE': 'FTSE 100',
  '^GDAXI': 'DAX 40',
  '^N225': 'Nikkei 225',
  '^TNX': 'US 10Y Yield',
  'BTC-USD': 'BTC/USD',
  'ETH-USD': 'ETH/USD',
}

export function symbolLabel(symbol: string): string {
  return SYMBOL_LABELS[symbol] ?? symbol
}
