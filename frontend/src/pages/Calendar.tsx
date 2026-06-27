import { useEffect, useState } from 'react'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Select } from '@/components/ui/Select'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'

interface CalEvent {
  title: string
  currency: string
  date: string
  impact: string
  forecast: string
  previous: string
}
interface CalData {
  events: CalEvent[]
  error?: string
}

const IMPACT_DOT: Record<string, string> = {
  high: 'bg-down',
  medium: 'bg-warning',
  low: 'bg-muted-foreground/60',
  holiday: 'bg-muted-foreground/30',
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
function pad(n: number) {
  return String(n).padStart(2, '0')
}

type Filter = 'all' | 'high' | 'medium' | 'low'
const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

function groupByDay(events: CalEvent[]): { day: string; items: CalEvent[] }[] {
  const groups: { day: string; items: CalEvent[] }[] = []
  for (const e of events) {
    const day = dayLabel(e.date)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(e)
    else groups.push({ day, items: [e] })
  }
  return groups
}

export default function Calendar() {
  const query = useWidgetData<CalData>(() => api('/api/calendar'), [], {
    pollMs: 600_000,
  })
  const [filter, setFilter] = useState<Filter>('all')
  const [ccy, setCcy] = useState('all')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const events = (query.data?.events ?? []).filter((e) => e.date)
  const currencies = [...new Set(events.map((e) => e.currency).filter(Boolean))].sort()
  const matches = (e: CalEvent) =>
    (filter === 'all' || e.impact === filter) && (ccy === 'all' || e.currency === ccy)
  const nextHigh = events
    .filter((e) => e.impact === 'high' && new Date(e.date).getTime() > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Economic Calendar" />

      {nextHigh &&
        (() => {
          const diff = Math.max(0, new Date(nextHigh.date).getTime() - now)
          const d = Math.floor(diff / 86_400_000)
          const h = Math.floor((diff % 86_400_000) / 3_600_000)
          const m = Math.floor((diff % 3_600_000) / 60_000)
          const s = Math.floor((diff % 60_000) / 1000)
          return (
            <Card spotlight className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs tracking-widest text-muted-foreground uppercase">
                  Next high-impact · {nextHigh.currency}
                </div>
                <div className="mt-1 text-lg font-semibold tracking-tight">{nextHigh.title}</div>
              </div>
              <div className="font-mono text-3xl font-semibold tabular-nums text-primary">
                {pad(d)}:{pad(h)}:{pad(m)}:{pad(s)}
              </div>
            </Card>
          )
        })()}

      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label="Impact filter"
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
        />
        {currencies.length > 0 && (
          <Select
            aria-label="Currency filter"
            wrapperClassName="w-auto"
            className="h-9 text-sm"
            value={ccy}
            onChange={(e) => setCcy(e.target.value)}
          >
            <option value="all">All currencies</option>
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        )}
      </div>

      <AsyncBoundary
        data={query.data}
        loading={query.loading}
        error={query.error}
        onRetry={query.refresh}
        isEmpty={(d) => !!d.error || !events.some(matches)}
        empty={
          <Card className="p-0">
            <EmptyState
              title={query.data?.error ? 'Calendar unavailable' : 'No events for this filter'}
              description={
                query.data?.error
                  ? "The upstream feed isn't reachable in this environment."
                  : 'Try a different impact filter.'
              }
            />
          </Card>
        }
      >
        {(d) => {
          const filtered = d.events.filter((e) => e.date && matches(e))
          return (
            <div className="space-y-6">
              {groupByDay(filtered).map((g) => (
                <Card key={g.day} className="p-0">
                  <div className="border-b border-border px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {g.day}
                  </div>
                  <ul>
                    {g.items.map((e, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 border-b border-border/40 px-4 py-2.5 text-sm last:border-0"
                      >
                        <span
                          className={cn(
                            'h-2 w-2 shrink-0 rounded-full',
                            IMPACT_DOT[e.impact] ?? IMPACT_DOT.low,
                          )}
                        />
                        <span className="w-16 shrink-0 text-xs tabular-nums text-muted-foreground">
                          {timeLabel(e.date)}
                        </span>
                        <Badge className="shrink-0">{e.currency}</Badge>
                        <span className="min-w-0 flex-1 truncate">{e.title}</span>
                        <span className="hidden shrink-0 gap-3 text-xs text-muted-foreground sm:flex">
                          <span>F: {e.forecast || '—'}</span>
                          <span>P: {e.previous || '—'}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          )
        }}
      </AsyncBoundary>
    </div>
  )
}
