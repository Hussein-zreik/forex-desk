export interface JournalEntry {
  id: string
  symbol: string
  direction: string
  pnl: number
  traded_on: string
  session: string
  mistake: string
  notes: string
}

export interface Summary {
  trades: number
  totalPnl: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  maxDrawdown: number
  bestStreak: number
  worstStreak: number
}

const r2 = (n: number) => Math.round(n * 100) / 100

export function summarize(entries: JournalEntry[]): Summary {
  const trades = entries.length
  const empty: Summary = {
    trades: 0,
    totalPnl: 0,
    winRate: 0,
    avgWin: 0,
    avgLoss: 0,
    profitFactor: 0,
    maxDrawdown: 0,
    bestStreak: 0,
    worstStreak: 0,
  }
  if (!trades) return empty

  const wins = entries.filter((e) => e.pnl > 0)
  const losses = entries.filter((e) => e.pnl < 0)
  const grossWin = wins.reduce((s, e) => s + e.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((s, e) => s + e.pnl, 0))

  let peak = 0
  let cum = 0
  let maxDd = 0
  let streak = 0
  let best = 0
  let worst = 0
  for (const e of entries) {
    cum += e.pnl
    peak = Math.max(peak, cum)
    maxDd = Math.max(maxDd, peak - cum)
    if (e.pnl >= 0) {
      streak = streak > 0 ? streak + 1 : 1
      best = Math.max(best, streak)
    } else {
      streak = streak < 0 ? streak - 1 : -1
      worst = Math.min(worst, streak)
    }
  }

  return {
    trades,
    totalPnl: r2(entries.reduce((s, e) => s + e.pnl, 0)),
    winRate: r2((wins.length / trades) * 100),
    avgWin: wins.length ? r2(grossWin / wins.length) : 0,
    avgLoss: losses.length ? r2(grossLoss / losses.length) : 0,
    profitFactor: grossLoss ? r2(grossWin / grossLoss) : grossWin > 0 ? 99 : 0,
    maxDrawdown: r2(maxDd),
    bestStreak: best,
    worstStreak: Math.abs(worst),
  }
}

export function equityCurve(entries: JournalEntry[]): { date: string; equity: number }[] {
  let cum = 0
  return entries.map((e) => {
    cum += e.pnl
    return { date: e.traded_on, equity: r2(cum) }
  })
}

function groupSum(
  entries: JournalEntry[],
  keyFn: (e: JournalEntry) => string,
): Record<string, number> {
  const m: Record<string, number> = {}
  for (const e of entries) {
    const k = keyFn(e)
    m[k] = (m[k] ?? 0) + e.pnl
  }
  return m
}

export function monthly(entries: JournalEntry[]): { month: string; pnl: number }[] {
  const m = groupSum(entries, (e) => e.traded_on.slice(0, 7))
  return Object.entries(m)
    .sort()
    .map(([month, pnl]) => ({ month, pnl: r2(pnl) }))
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function byWeekday(entries: JournalEntry[]): { day: string; pnl: number }[] {
  const m = groupSum(entries, (e) => WEEKDAYS[new Date(e.traded_on).getUTCDay()])
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => ({ day, pnl: r2(m[day] ?? 0) }))
}

export function bySession(entries: JournalEntry[]): { session: string; pnl: number }[] {
  const m = groupSum(entries, (e) => e.session || '—')
  return Object.entries(m).map(([session, pnl]) => ({ session, pnl: r2(pnl) }))
}

export function byMistake(entries: JournalEntry[]): { mistake: string; count: number }[] {
  const counts: Record<string, number> = {}
  for (const e of entries) {
    if (e.mistake) counts[e.mistake] = (counts[e.mistake] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([mistake, count]) => ({ mistake, count }))
    .sort((a, b) => b.count - a.count)
}

export function toCsv(entries: JournalEntry[]): string {
  const header = 'symbol,direction,pnl,traded_on,session,mistake,notes'
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`
  const rows = entries.map((e) =>
    [e.symbol, e.direction, e.pnl, e.traded_on, e.session, e.mistake, e.notes]
      .map((v) => esc(String(v ?? '')))
      .join(','),
  )
  return [header, ...rows].join('\n')
}

export function parseCsv(text: string): Partial<JournalEntry>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const cols = lines[0].split(',').map((c) => c.trim())
  return lines.slice(1).map((line) => {
    const cells = line.match(/("([^"]|"")*"|[^,]*)/g)?.filter((_, i) => i % 2 === 0) ?? []
    const obj: Record<string, string> = {}
    cols.forEach((c, i) => {
      obj[c] = (cells[i] ?? '').replace(/^"|"$/g, '').replace(/""/g, '"')
    })
    return {
      symbol: obj.symbol,
      direction: obj.direction,
      pnl: parseFloat(obj.pnl) || 0,
      traded_on: obj.traded_on,
      session: obj.session ?? '',
      mistake: obj.mistake ?? '',
      notes: obj.notes ?? '',
    }
  })
}
