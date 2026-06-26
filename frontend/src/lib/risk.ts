/**
 * Position-sizing and risk math for FX/metals. All money values are in the
 * account currency, assumed USD (the majors here are USD-quoted or USD-based, so
 * pip value resolves to USD without an extra FX conversion).
 */

export interface Instrument {
  /** Smallest conventional price increment (a "pip"). */
  pip: number
  /** Units of the base asset in one standard lot. */
  contract: number
  base: string
  quote: string
}

/** Instruments the calculator supports (USD-quoted or USD-based + gold). */
export const INSTRUMENTS: Record<string, Instrument> = {
  'EURUSD=X': { pip: 0.0001, contract: 100_000, base: 'EUR', quote: 'USD' },
  'GBPUSD=X': { pip: 0.0001, contract: 100_000, base: 'GBP', quote: 'USD' },
  'AUDUSD=X': { pip: 0.0001, contract: 100_000, base: 'AUD', quote: 'USD' },
  'NZDUSD=X': { pip: 0.0001, contract: 100_000, base: 'NZD', quote: 'USD' },
  'USDJPY=X': { pip: 0.01, contract: 100_000, base: 'USD', quote: 'JPY' },
  'USDCHF=X': { pip: 0.0001, contract: 100_000, base: 'USD', quote: 'CHF' },
  'USDCAD=X': { pip: 0.0001, contract: 100_000, base: 'USD', quote: 'CAD' },
  'XAU=F': { pip: 0.01, contract: 100, base: 'XAU', quote: 'USD' }, // 1 lot = 100 oz
}

export const CALC_SYMBOLS = Object.keys(INSTRUMENTS)

export function pipSize(symbol: string): number {
  return INSTRUMENTS[symbol]?.pip ?? 0.0001
}

/** Distance between two prices expressed in pips. */
export function pipsBetween(symbol: string, a: number, b: number): number {
  return Math.abs(a - b) / pipSize(symbol)
}

/**
 * Value of one pip for one standard lot, in USD. Returns null for cross pairs
 * where neither side is USD (would need an extra conversion rate).
 */
export function pipValueUsd(symbol: string, price: number): number | null {
  const inst = INSTRUMENTS[symbol]
  if (!inst || !price) return null
  const perPipInQuote = inst.pip * inst.contract
  if (inst.quote === 'USD') return perPipInQuote
  if (inst.base === 'USD') return perPipInQuote / price
  return null
}

export interface RiskInput {
  balance: number
  riskPct: number
  entry: number
  stop: number
  symbol: string
}

export interface RiskResult {
  riskUsd: number
  stopPips: number
  pipValueUsd: number
  lots: number
  units: number
}

/**
 * Size a position so the loss at the stop equals `riskPct` of the balance.
 * Returns null when inputs are incomplete or the stop sits at the entry.
 */
export function positionSize(input: RiskInput): RiskResult | null {
  const { balance, riskPct, entry, stop, symbol } = input
  if (!balance || !riskPct || !entry || !stop || entry === stop) return null
  const pv = pipValueUsd(symbol, entry)
  if (pv == null || pv === 0) return null
  const riskUsd = (balance * riskPct) / 100
  const stopPips = pipsBetween(symbol, entry, stop)
  if (stopPips === 0) return null
  const lots = riskUsd / (stopPips * pv)
  return {
    riskUsd,
    stopPips,
    pipValueUsd: pv,
    lots,
    units: lots * (INSTRUMENTS[symbol]?.contract ?? 0),
  }
}

/** Reward-to-risk ratio for an entry/stop/target. Null if stop is at entry. */
export function riskReward(entry: number, stop: number, target: number): number | null {
  const risk = Math.abs(entry - stop)
  if (!risk) return null
  return Math.abs(target - entry) / risk
}
