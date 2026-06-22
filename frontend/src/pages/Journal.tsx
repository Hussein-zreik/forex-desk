import { Trash2 } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import {
  bySession,
  byWeekday,
  equityCurve,
  type JournalEntry,
  monthly,
  parseCsv,
  summarize,
  toCsv,
} from '@/lib/journalAnalytics'

const SESSIONS = ['', 'Sydney', 'Tokyo', 'London', 'New York']
const TOOLTIP = {
  contentStyle: {
    background: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--foreground)',
  },
  labelStyle: { color: 'var(--muted-foreground)' },
  cursor: { fill: 'var(--surface)' },
}
const TICK = { fill: 'var(--muted-foreground)', fontSize: 11 }

function money(n: number): string {
  return `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString()}`
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Card className="p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn('mt-0.5 text-lg font-semibold tabular-nums', color)}>{value}</div>
    </Card>
  )
}

function BarPanel({ title, data, xKey }: { title: string; data: { pnl: number }[]; xKey: string }) {
  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold tracking-tight">{title}</h3>
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey={xKey} tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tick={TICK} axisLine={false} tickLine={false} width={36} />
            <Tooltip {...TOOLTIP} />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.pnl >= 0 ? 'var(--up)' : 'var(--down)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default function Journal() {
  const { data, refresh } = useWidgetData<JournalEntry[]>(() => api('/api/journal'), [])
  const entries = data ?? []
  const stats = summarize(entries)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    symbol: 'XAU=F',
    direction: 'LONG',
    pnl: '',
    traded_on: new Date().toISOString().slice(0, 10),
    session: '',
    mistake: '',
    notes: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function add(e: FormEvent) {
    e.preventDefault()
    const pnl = parseFloat(form.pnl)
    if (Number.isNaN(pnl) || !form.traded_on) return
    await api('/api/journal', { method: 'POST', body: JSON.stringify({ ...form, pnl }) })
    setForm((f) => ({ ...f, pnl: '', mistake: '', notes: '' }))
    await refresh()
  }

  async function remove(id: string) {
    await api(`/api/journal/${id}`, { method: 'DELETE' })
    await refresh()
  }

  function exportCsv() {
    const blob = new Blob([toCsv(entries)], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'forex-desk-journal.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importCsv(file: File) {
    const rows = parseCsv(await file.text())
    for (const r of rows) {
      if (!r.traded_on || r.pnl == null) continue
      await api('/api/journal', { method: 'POST', body: JSON.stringify(r) }).catch(() => {})
    }
    await refresh()
  }

  const selectCls =
    'h-10 rounded-lg border border-input bg-bg-elevated px-2 text-sm text-foreground'

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Journal</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
            Import CSV
          </Button>
          <Button size="sm" variant="secondary" onClick={exportCsv}>
            Export CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importCsv(f)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Total P&L"
          value={money(stats.totalPnl)}
          color={stats.totalPnl > 0 ? 'text-up' : stats.totalPnl < 0 ? 'text-down' : undefined}
        />
        <Stat label="Win Rate" value={`${stats.winRate}%`} />
        <Stat label="Trades" value={String(stats.trades)} />
        <Stat label="Profit Factor" value={String(stats.profitFactor)} />
        <Stat label="Avg Win" value={money(stats.avgWin)} color="text-up" />
        <Stat label="Avg Loss" value={money(-stats.avgLoss)} color="text-down" />
        <Stat label="Max Drawdown" value={money(-stats.maxDrawdown)} color="text-down" />
        <Stat label="Best Streak" value={`${stats.bestStreak}W`} />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold tracking-tight">Log a Trade</h2>
        <form onSubmit={add} className="flex flex-wrap items-end gap-2">
          <Input
            value={form.symbol}
            onChange={(e) => set('symbol', e.target.value)}
            placeholder="Symbol"
            className="w-28"
          />
          <select
            value={form.direction}
            onChange={(e) => set('direction', e.target.value)}
            className={selectCls}
          >
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>
          <Input
            type="number"
            inputMode="decimal"
            value={form.pnl}
            onChange={(e) => set('pnl', e.target.value)}
            placeholder="P&L"
            className="w-24"
          />
          <Input
            type="date"
            value={form.traded_on}
            onChange={(e) => set('traded_on', e.target.value)}
            className="w-40"
          />
          <select
            value={form.session}
            onChange={(e) => set('session', e.target.value)}
            className={selectCls}
          >
            {SESSIONS.map((s) => (
              <option key={s} value={s}>
                {s || 'Session'}
              </option>
            ))}
          </select>
          <Input
            value={form.mistake}
            onChange={(e) => set('mistake', e.target.value)}
            placeholder="Mistake (optional)"
            className="w-40"
          />
          <Button type="submit">Log</Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold tracking-tight">Equity Curve</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurve(entries)}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} minTickGap={40} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} width={44} />
              <Tooltip {...TOOLTIP} />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#eq)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <BarPanel title="Monthly Returns" data={monthly(entries)} xKey="month" />
        <BarPanel title="By Session" data={bySession(entries)} xKey="session" />
        <BarPanel title="By Weekday" data={byWeekday(entries)} xKey="day" />
      </div>

      <Card className="overflow-x-auto p-0">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No trades logged yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Symbol</th>
                <th className="p-3 font-medium">Dir</th>
                <th className="p-3 text-right font-medium">P&L</th>
                <th className="p-3 font-medium">Session</th>
                <th className="p-3 font-medium">Mistake</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {[...entries].reverse().map((e) => (
                <tr key={e.id} className="border-b border-border/50 last:border-0">
                  <td className="p-3 tabular-nums">{e.traded_on}</td>
                  <td className="p-3 font-medium">{e.symbol}</td>
                  <td className={cn('p-3', e.direction === 'LONG' ? 'text-up' : 'text-down')}>
                    {e.direction}
                  </td>
                  <td
                    className={cn(
                      'p-3 text-right font-medium tabular-nums',
                      e.pnl >= 0 ? 'text-up' : 'text-down',
                    )}
                  >
                    {e.pnl >= 0 ? '+' : ''}
                    {money(e.pnl)}
                  </td>
                  <td className="p-3 text-muted-foreground">{e.session || '—'}</td>
                  <td className="p-3 text-muted-foreground">{e.mistake || '—'}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(e.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
