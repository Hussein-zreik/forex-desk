/**
 * Central-bank policy rates — a static reference dataset (the app uses static
 * datasets for slow-moving macro data, like seasonality and rate differentials).
 * Indicative values; update `CB_AS_OF` and the rates after each decision cycle.
 */
export type RateBias = 'hike' | 'cut' | 'hold'

export interface CentralBank {
  bank: string
  ccy: string
  rate: number
  /** Direction of the most recent move. */
  lastMove: RateBias
  /** Approximate next decision month (YYYY-MM). */
  nextMeeting: string
}

export const CB_AS_OF = '2026-06'

export const CENTRAL_BANKS: CentralBank[] = [
  { bank: 'Federal Reserve', ccy: 'USD', rate: 4.5, lastMove: 'hold', nextMeeting: '2026-07' },
  { bank: 'ECB', ccy: 'EUR', rate: 2.4, lastMove: 'cut', nextMeeting: '2026-07' },
  { bank: 'Bank of England', ccy: 'GBP', rate: 4.25, lastMove: 'cut', nextMeeting: '2026-08' },
  { bank: 'Bank of Japan', ccy: 'JPY', rate: 0.5, lastMove: 'hike', nextMeeting: '2026-07' },
  { bank: 'SNB', ccy: 'CHF', rate: 0.25, lastMove: 'cut', nextMeeting: '2026-09' },
  { bank: 'RBA', ccy: 'AUD', rate: 3.85, lastMove: 'cut', nextMeeting: '2026-07' },
  { bank: 'Bank of Canada', ccy: 'CAD', rate: 2.75, lastMove: 'hold', nextMeeting: '2026-07' },
  { bank: 'RBNZ', ccy: 'NZD', rate: 3.25, lastMove: 'cut', nextMeeting: '2026-08' },
]
