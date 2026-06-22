import { Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
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

function Stat({
  label,
  value,
  money,
  colorByValue,
}: {
  label: string
  value: number
  money?: boolean
  colorByValue?: boolean
}) {
  const color = colorByValue
    ? value > 0
      ? 'text-up'
      : value < 0
        ? 'text-down'
        : 'text-foreground'
    : 'text-foreground'
  const display = money
    ? `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString()}`
    : value.toLocaleString()
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('mt-1 text-2xl font-semibold tabular-nums', color)}>{display}</div>
    </Card>
  )
}

export default function Portfolio() {
  const { data, refresh } = useWidgetData<PortfolioData>(() => api('/api/portfolio'), [], {
    pollMs: 15_000,
  })
  const positions = data?.positions ?? []
  const stats = data?.stats

  const [symbol, setSymbol] = useState('XAU=F')
  const [side, setSide] = useState('LONG')
  const [size, setSize] = useState('')
  const [entry, setEntry] = useState('')

  async function add(e: FormEvent) {
    e.preventDefault()
    const sz = parseFloat(size)
    const ep = parseFloat(entry)
    if (!sz || !ep) return
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

  const selectCls =
    'h-10 rounded-lg border border-input bg-bg-elevated px-2 text-sm text-foreground'

  return (
    <div className="animate-fade-up space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total P&L" value={stats?.totalPnl ?? 0} money colorByValue />
        <Stat label="Open Positions" value={stats?.openCount ?? 0} />
        <Stat label="Notional" value={stats?.notional ?? 0} money />
        <Stat label="Winners" value={stats?.winners ?? 0} />
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold tracking-tight">Add Position</h2>
        <form onSubmit={add} className="flex flex-wrap items-end gap-2">
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={selectCls}>
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {SYMBOL_LABELS[s] ?? s}
              </option>
            ))}
          </select>
          <select value={side} onChange={(e) => setSide(e.target.value)} className={selectCls}>
            <option value="LONG">Long</option>
            <option value="SHORT">Short</option>
          </select>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-24"
          />
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Entry price"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className="w-32"
          />
          <Button type="submit">Add</Button>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        {positions.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No open positions. Add one above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Symbol</th>
                <th className="p-3 font-medium">Side</th>
                <th className="p-3 text-right font-medium">Size</th>
                <th className="p-3 text-right font-medium">Entry</th>
                <th className="p-3 text-right font-medium">Current</th>
                <th className="p-3 text-right font-medium">P&L</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id} className="border-b border-border/50 last:border-0">
                  <td className="p-3 font-medium">{symbolLabel(p.symbol)}</td>
                  <td className="p-3">
                    <span className={cn(p.side === 'LONG' ? 'text-up' : 'text-down')}>
                      {p.side}
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums">{p.size}</td>
                  <td className="p-3 text-right tabular-nums">{fmtPrice(p.entryPrice)}</td>
                  <td className="p-3 text-right tabular-nums">{fmtPrice(p.currentPrice)}</td>
                  <td
                    className={cn(
                      'p-3 text-right font-medium tabular-nums',
                      p.pnl == null
                        ? 'text-muted-foreground'
                        : p.pnl >= 0
                          ? 'text-up'
                          : 'text-down',
                    )}
                  >
                    {p.pnl == null ? '—' : `${p.pnl >= 0 ? '+' : ''}$${p.pnl.toLocaleString()}`}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Close position"
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
