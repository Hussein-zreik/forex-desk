import { describe, expect, it } from 'vitest'
import { byMistake, byTag, type JournalEntry, parseCsv, summarize, toCsv } from './journalAnalytics'

const entry = (over: Partial<JournalEntry>): JournalEntry => ({
  id: Math.random().toString(36).slice(2),
  symbol: 'XAU=F',
  direction: 'LONG',
  pnl: 100,
  traded_on: '2026-07-01',
  session: 'London',
  mistake: '',
  notes: '',
  tags: '',
  ...over,
})

describe('byTag', () => {
  it('aggregates pnl and counts per tag across entries', () => {
    const rows = byTag([
      entry({ pnl: 100, tags: 'breakout,fomo' }),
      entry({ pnl: -40, tags: 'fomo' }),
      entry({ pnl: 25, tags: '' }),
    ])
    expect(rows).toEqual([
      { tag: 'fomo', pnl: 60, count: 2 },
      { tag: 'breakout', pnl: 100, count: 1 },
    ])
  })

  it('tolerates entries without a tags field (legacy rows)', () => {
    const legacy = { ...entry({}), tags: undefined } as unknown as JournalEntry
    expect(byTag([legacy])).toEqual([])
  })
})

describe('byMistake', () => {
  it('counts mistakes, most frequent first', () => {
    const rows = byMistake([
      entry({ mistake: 'moved stop' }),
      entry({ mistake: 'moved stop' }),
      entry({ mistake: 'oversized' }),
      entry({}),
    ])
    expect(rows).toEqual([
      { mistake: 'moved stop', count: 2 },
      { mistake: 'oversized', count: 1 },
    ])
  })
})

describe('csv round-trip', () => {
  it('preserves tags (and commas inside quoted fields)', () => {
    const entries = [
      entry({ symbol: 'EURUSD=X', pnl: -12.5, tags: 'fomo,news', notes: 'said "wait", did not' }),
    ]
    const parsed = parseCsv(toCsv(entries))
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toMatchObject({
      symbol: 'EURUSD=X',
      pnl: -12.5,
      tags: 'fomo,news',
      notes: 'said "wait", did not',
    })
  })

  it('defaults tags to empty when the column is missing (old exports)', () => {
    const old = 'symbol,direction,pnl,traded_on,session,mistake,notes\n"XAU=F","LONG","5","2026-07-01","","",""'
    expect(parseCsv(old)[0]).toMatchObject({ symbol: 'XAU=F', tags: '' })
  })
})

describe('summarize', () => {
  it('still computes the headline stats', () => {
    const s = summarize([entry({ pnl: 100 }), entry({ pnl: -50 })])
    expect(s.trades).toBe(2)
    expect(s.totalPnl).toBe(50)
    expect(s.winRate).toBe(50)
  })
})
