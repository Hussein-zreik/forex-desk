import { ClipboardList, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent } from 'react'
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
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { type Column, DataTable } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { StatCard } from '@/components/ui/StatCard'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
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

const COLUMNS: Column<JournalEntry>[] = [
  {
    key: 'date',
    header: 'Date',
    cell: (e) => e.traded_on,
    cellClassName: 'whitespace-nowrap tabular-nums',
  },
  {
    key: 'symbol',
    header: 'Symbol',
    cell: (e) => e.symbol,
    cellClassName: 'font-medium whitespace-nowrap',
  },
  {
    key: 'dir',
    header: 'Dir',
    cell: (e) => <Badge variant={e.direction === 'LONG' ? 'up' : 'down'}>{e.direction}</Badge>,
  },
  {
    key: 'pnl',
    header: 'P&L',
    numeric: true,
    cellClassName: (e) => (e.pnl >= 0 ? 'text-up font-medium' : 'text-down font-medium'),
    cell: (e) => `${e.pnl >= 0 ? '+' : ''}${money(e.pnl)}`,
  },
  {
    key: 'session',
    header: 'Session',
    cell: (e) => e.session || '—',
    cellClassName: 'whitespace-nowrap text-muted-foreground',
  },
  {
    key: 'mistake',
    header: 'Mistake',
    cell: (e) => e.mistake || '—',
    cellClassName: 'max-w-[12rem] truncate text-muted-foreground',
    hideOnMobile: true,
  },
]

export default function Journal() {
  const query = useWidgetData<JournalEntry[]>(() => api('/api/journal'), [])
  const { refresh } = query
  const entries = useMemo(() => query.data ?? [], [query.data])
  const stats = summarize(entries)
  const fileRef = useRef<HTMLInputElement>(null)

  // Newest first for the table.
  const rows = useMemo(() => [...entries].reverse(), [entries])

  const [form, setForm] = useState({
    symbol: 'XAU=F',
    direction: 'LONG',
    pnl: '',
    traded_on: new Date().toISOString().slice(0, 10),
    session: '',
    mistake: '',
    notes: '',
  })
  const [errors, setErrors] = useState<{ pnl?: string; traded_on?: string }>({})
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function add(e: FormEvent) {
    e.preventDefault()
    const pnl = parseFloat(form.pnl)
    const next: { pnl?: string; traded_on?: string } = {}
    if (Number.isNaN(pnl)) next.pnl = 'Enter the trade P&L (can be negative).'
    if (!form.traded_on) next.traded_on = 'Pick the trade date.'
    setErrors(next)
    if (next.pnl || next.traded_on) return
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
    const parsed = parseCsv(await file.text())
    for (const r of parsed) {
      if (!r.traded_on || r.pnl == null) continue
      await api('/api/journal', { method: 'POST', body: JSON.stringify(r) }).catch(() => {})
    }
    await refresh()
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Journal"
        actions={
          <>
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
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard size="sm" label="Total P&L" value={stats.totalPnl} format="money" colorByValue />
        <StatCard size="sm" label="Win Rate" value={`${stats.winRate}%`} />
        <StatCard size="sm" label="Trades" value={stats.trades} />
        <StatCard size="sm" label="Profit Factor" value={stats.profitFactor} />
        <StatCard size="sm" label="Avg Win" value={stats.avgWin} format="money" tone="up" />
        <StatCard size="sm" label="Avg Loss" value={-stats.avgLoss} format="money" tone="down" />
        <StatCard
          size="sm"
          label="Max Drawdown"
          value={-stats.maxDrawdown}
          format="money"
          tone="down"
        />
        <StatCard size="sm" label="Best Streak" value={`${stats.bestStreak}W`} />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold tracking-tight">Log a Trade</h2>
        <form onSubmit={add} className="flex flex-wrap items-start gap-3">
          <Field label="Symbol" className="w-32">
            {(p) => (
              <Input {...p} value={form.symbol} onChange={(e) => set('symbol', e.target.value)} />
            )}
          </Field>
          <Field label="Direction" className="w-32">
            {(p) => (
              <Select
                {...p}
                value={form.direction}
                onChange={(e) => set('direction', e.target.value)}
              >
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </Select>
            )}
          </Field>
          <Field label="P&L" error={errors.pnl} className="w-28">
            {(p) => (
              <Input
                {...p}
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={form.pnl}
                onChange={(e) => set('pnl', e.target.value)}
              />
            )}
          </Field>
          <Field label="Date" error={errors.traded_on} className="w-40">
            {(p) => (
              <Input
                {...p}
                type="date"
                value={form.traded_on}
                onChange={(e) => set('traded_on', e.target.value)}
              />
            )}
          </Field>
          <Field label="Session" className="w-36">
            {(p) => (
              <Select {...p} value={form.session} onChange={(e) => set('session', e.target.value)}>
                {SESSIONS.map((s) => (
                  <option key={s} value={s}>
                    {s || 'Any'}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Mistake (optional)" className="w-44">
            {(p) => (
              <Input {...p} value={form.mistake} onChange={(e) => set('mistake', e.target.value)} />
            )}
          </Field>
          <Button type="submit" className="mt-[22px]">
            Log
          </Button>
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

      <Card className="p-0">
        <AsyncBoundary
          data={query.data}
          loading={query.loading}
          error={query.error}
          onRetry={refresh}
          isEmpty={() => rows.length === 0}
          empty={
            <EmptyState
              icon={ClipboardList}
              title="No trades logged yet"
              description="Log your first trade above, or import a CSV to backfill history."
            />
          }
        >
          {() => (
            <DataTable
              columns={COLUMNS}
              rows={rows}
              rowKey={(e) => e.id}
              caption="Logged trades"
              stickyHeader
              virtual={{ rowHeight: 48, threshold: 40, maxHeight: '34rem' }}
              rowActions={(e) => (
                <button
                  type="button"
                  onClick={() => remove(e.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            />
          )}
        </AsyncBoundary>
      </Card>
    </div>
  )
}
