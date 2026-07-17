import { ClipboardList, Pencil, Trash2 } from 'lucide-react'
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
  byMistake,
  bySession,
  byTag,
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
  {
    key: 'tags',
    header: 'Tags',
    cell: (e) =>
      e.tags ? (
        <span className="flex flex-wrap gap-1">
          {e.tags.split(',').map((t) => (
            <span key={t} className="rounded bg-surface px-1 font-mono text-[10px]">
              {t}
            </span>
          ))}
        </span>
      ) : (
        '—'
      ),
    cellClassName: 'max-w-[12rem]',
    hideOnMobile: true,
  },
]

interface AlignmentStats {
  n: number
  win_rate: number | null
  avg_pnl: number | null
}

interface Alignment {
  with: AlignmentStats
  against: AlignmentStats
  no_data: AlignmentStats
}

function AlignmentRow({ label, s, tone }: { label: string; s: AlignmentStats; tone?: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className={tone ?? 'text-muted-foreground'}>{label}</span>
      <span className="ml-auto font-mono text-xs tabular-nums">
        {s.n === 0 ? (
          <span className="text-muted-foreground">no trades</span>
        ) : (
          <>
            {s.win_rate}% win · avg {money(s.avg_pnl ?? 0)} · n={s.n}
          </>
        )}
      </span>
    </li>
  )
}

function BiasAlignmentCard({ version }: { version: number }) {
  const query = useWidgetData<Alignment>(() => api('/api/journal/bias-alignment'), [version])
  const d = query.data
  // Defensive on shape: degraded/unavailable payloads hide the card rather
  // than throwing into the page tree.
  if (!d?.with || !d.against || !d.no_data) return null
  const graded = d.with.n + d.against.n
  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold tracking-tight">Bias Alignment</h3>
      {graded === 0 ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          No overlap yet between your trades and the recorded bias — snapshots accrue hourly, so
          this fills in as you trade tracked symbols.
          {d.no_data.n > 0 && ` (${d.no_data.n} trades without a same-day snapshot.)`}
        </p>
      ) : (
        <ul className="space-y-1.5">
          <AlignmentRow label="With published bias" s={d.with} tone="text-up" />
          <AlignmentRow label="Against published bias" s={d.against} tone="text-down" />
          <AlignmentRow label="No same-day snapshot" s={d.no_data} />
        </ul>
      )}
    </Card>
  )
}

export default function Journal() {
  const query = useWidgetData<JournalEntry[]>(() => api('/api/journal'), [])
  const { refresh } = query
  // Array-guard: an error payload must never crash the page (spread below).
  const entries = useMemo(
    () => (Array.isArray(query.data) ? query.data : []),
    [query.data],
  )
  const stats = summarize(entries)
  const fileRef = useRef<HTMLInputElement>(null)
  const stmtRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  // Newest first for the table.
  const rows = useMemo(() => [...entries].reverse(), [entries])

  const blankForm = {
    symbol: 'XAU=F',
    direction: 'LONG',
    pnl: '',
    traded_on: new Date().toISOString().slice(0, 10),
    session: '',
    mistake: '',
    notes: '',
    tags: '',
  }
  const [form, setForm] = useState(blankForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ pnl?: string; traded_on?: string }>({})
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const formRef = useRef<HTMLFormElement>(null)

  function startEdit(entry: JournalEntry) {
    setEditingId(entry.id)
    setForm({
      symbol: entry.symbol,
      direction: entry.direction,
      pnl: String(entry.pnl),
      traded_on: entry.traded_on,
      session: entry.session,
      mistake: entry.mistake,
      notes: entry.notes,
      tags: entry.tags ?? '',
    })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(blankForm)
    setErrors({})
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const pnl = parseFloat(form.pnl)
    const next: { pnl?: string; traded_on?: string } = {}
    if (Number.isNaN(pnl)) next.pnl = 'Enter the trade P&L (can be negative).'
    if (!form.traded_on) next.traded_on = 'Pick the trade date.'
    setErrors(next)
    if (next.pnl || next.traded_on) return
    if (editingId) {
      await api(`/api/journal/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...form, pnl }),
      })
      cancelEdit()
    } else {
      await api('/api/journal', { method: 'POST', body: JSON.stringify({ ...form, pnl }) })
      setForm((f) => ({ ...f, pnl: '', mistake: '', notes: '', tags: '' }))
    }
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

  async function importStatement(file: File) {
    setImportMsg(null)
    const body = new FormData()
    body.append('file', file)
    try {
      const res = await api<{ imported: number; skipped: number; errors: string[] }>(
        '/api/journal/import',
        { method: 'POST', body },
      )
      setImportMsg(
        `Imported ${res.imported} trade${res.imported === 1 ? '' : 's'}` +
          (res.skipped ? `, skipped ${res.skipped} already imported` : '') +
          (res.errors.length ? ` — ${res.errors.length} rows had problems` : '') +
          '.',
      )
      await refresh()
    } catch {
      setImportMsg('Could not read that file — export the statement from MT4/MT5 as HTML or CSV.')
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Journal"
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => stmtRef.current?.click()}>
              Import MT4/MT5
            </Button>
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
            <input
              ref={stmtRef}
              type="file"
              accept=".html,.htm,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void importStatement(f)
                e.target.value = ''
              }}
            />
          </>
        }
      />

      {importMsg && (
        <p role="status" className="text-xs text-muted-foreground">
          {importMsg}
        </p>
      )}

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
        <h2 className="mb-3 text-sm font-semibold tracking-tight">
          {editingId ? 'Edit Trade' : 'Log a Trade'}
        </h2>
        <form ref={formRef} onSubmit={submit} className="flex flex-wrap items-start gap-3">
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
          <Field label="Tags (comma-separated)" className="w-48">
            {(p) => (
              <Input
                {...p}
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="fomo, breakout"
              />
            )}
          </Field>
          <Button type="submit" className="mt-[22px]">
            {editingId ? 'Save' : 'Log'}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" className="mt-[22px]" onClick={cancelEdit}>
              Cancel
            </Button>
          )}
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

      <BiasAlignmentCard version={entries.length} />

      {(byTag(entries).length > 0 || byMistake(entries).length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {byTag(entries).length > 0 && (
            <BarPanel title="P&L by Tag" data={byTag(entries)} xKey="tag" />
          )}
          {byMistake(entries).length > 0 && (
            <Card>
              <h3 className="mb-2 text-sm font-semibold tracking-tight">Top Mistakes</h3>
              <ul className="space-y-1.5">
                {byMistake(entries)
                  .slice(0, 6)
                  .map((m) => (
                    <li key={m.mistake} className="flex items-center gap-2 text-sm">
                      <span className="truncate text-muted-foreground">{m.mistake}</span>
                      <span className="ml-auto rounded bg-down/15 px-1.5 font-mono text-xs text-down">
                        ×{m.count}
                      </span>
                    </li>
                  ))}
              </ul>
            </Card>
          )}
        </div>
      )}

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
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(e)}
                    className="text-muted-foreground hover:text-primary"
                    aria-label="Edit entry"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(e.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              )}
            />
          )}
        </AsyncBoundary>
      </Card>
    </div>
  )
}
