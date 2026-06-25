import { PackageOpen, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
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
import { fmtPrice } from '@/lib/format'
import { SYMBOL_LABELS, symbolLabel } from '@/lib/symbols'

interface Position {
  id: string
  symbol: string
  side: string
  size: number
  entryPrice: number
  currentPrice: number | null
  pnl: number | null
}
interface PortfolioData {
  positions: Position[]
  stats: { totalPnl: number; openCount: number; notional: number; winners: number }
}

const SYMBOLS = ['XAU=F', 'XAG=F', 'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'DX-Y.NYB', 'BTC-USD']

const COLUMNS: Column<Position>[] = [
  { key: 'symbol', header: 'Symbol', cell: (p) => symbolLabel(p.symbol), cellClassName: 'font-medium' },
  {
    key: 'side',
    header: 'Side',
    cell: (p) => <Badge variant={p.side === 'LONG' ? 'up' : 'down'}>{p.side}</Badge>,
  },
  { key: 'size', header: 'Size', numeric: true, cell: (p) => p.size },
  { key: 'entry', header: 'Entry', numeric: true, cell: (p) => fmtPrice(p.entryPrice) },
  { key: 'current', header: 'Current', numeric: true, cell: (p) => fmtPrice(p.currentPrice) },
  {
    key: 'pnl',
    header: 'P&L',
    numeric: true,
    cellClassName: (p) =>
      p.pnl == null ? 'text-muted-foreground font-medium' : p.pnl >= 0 ? 'text-up font-medium' : 'text-down font-medium',
    cell: (p) => (p.pnl == null ? '—' : `${p.pnl >= 0 ? '+' : ''}$${p.pnl.toLocaleString()}`),
  },
]

export default function Portfolio() {
  const query = useWidgetData<PortfolioData>(() => api('/api/portfolio'), [], {
    pollMs: 15_000,
  })
  const { refresh } = query
  const stats = query.data?.stats

  const [symbol, setSymbol] = useState('XAU=F')
  const [side, setSide] = useState('LONG')
  const [size, setSize] = useState('')
  const [entry, setEntry] = useState('')
  const [errors, setErrors] = useState<{ size?: string; entry?: string }>({})

  async function add(e: FormEvent) {
    e.preventDefault()
    const sz = parseFloat(size)
    const ep = parseFloat(entry)
    const next: { size?: string; entry?: string } = {}
    if (!sz || sz <= 0) next.size = 'Enter a position size greater than 0.'
    if (!ep || ep <= 0) next.entry = 'Enter an entry price greater than 0.'
    setErrors(next)
    if (next.size || next.entry) return
    await api('/api/portfolio', {
      method: 'POST',
      body: JSON.stringify({ symbol, side, size: sz, entry_price: ep }),
    })
    setSize('')
    setEntry('')
    await refresh()
  }

  async function remove(id: string) {
    await api(`/api/portfolio/${id}`, { method: 'DELETE' })
    await refresh()
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Portfolio" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total P&L" value={stats?.totalPnl ?? 0} format="money" colorByValue />
        <StatCard label="Open Positions" value={stats?.openCount ?? 0} />
        <StatCard label="Notional" value={stats?.notional ?? 0} format="money" />
        <StatCard label="Winners" value={stats?.winners ?? 0} />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold tracking-tight">Add Position</h2>
        <form onSubmit={add} className="flex flex-wrap items-start gap-3">
          <Field label="Symbol" className="w-40">
            {(p) => (
              <Select {...p} value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                {SYMBOLS.map((s) => (
                  <option key={s} value={s}>
                    {SYMBOL_LABELS[s] ?? s}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Side" className="w-32">
            {(p) => (
              <Select {...p} value={side} onChange={(e) => setSide(e.target.value)}>
                <option value="LONG">Long</option>
                <option value="SHORT">Short</option>
              </Select>
            )}
          </Field>
          <Field label="Size" error={errors.size} className="w-32">
            {(p) => (
              <Input
                {...p}
                type="number"
                inputMode="decimal"
                placeholder="0.0"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            )}
          </Field>
          <Field label="Entry price" error={errors.entry} className="w-36">
            {(p) => (
              <Input
                {...p}
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
              />
            )}
          </Field>
          <Button type="submit" className="mt-[22px]">
            Add
          </Button>
        </form>
      </Card>

      <Card className="p-0">
        <AsyncBoundary
          data={query.data}
          loading={query.loading}
          error={query.error}
          onRetry={refresh}
          isEmpty={(d) => d.positions.length === 0}
          empty={
            <EmptyState
              icon={PackageOpen}
              title="No open positions"
              description="Add a position above to start tracking live P&L."
            />
          }
        >
          {(d) => (
            <DataTable
              columns={COLUMNS}
              rows={d.positions}
              rowKey={(p) => p.id}
              caption="Open positions"
              rowActions={(p) => (
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Close position"
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
