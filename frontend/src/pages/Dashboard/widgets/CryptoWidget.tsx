import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'
import { fmtPrice, fmtSigned } from '@/lib/format'
import { type Quote } from '@/store/useMarketData'

const CRYPTO = [
  'BTC-USD',
  'ETH-USD',
  'SOL-USD',
  'XRP-USD',
  'BNB-USD',
  'DOGE-USD',
  'ADA-USD',
  'AVAX-USD',
]
const LABEL: Record<string, string> = {
  'BTC-USD': 'BTC',
  'ETH-USD': 'ETH',
  'SOL-USD': 'SOL',
  'XRP-USD': 'XRP',
  'BNB-USD': 'BNB',
  'DOGE-USD': 'DOGE',
  'ADA-USD': 'ADA',
  'AVAX-USD': 'AVAX',
}

const withPrice = (quotes: Quote[]) => quotes.filter((q) => q.price != null)

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function CryptoWidget({ editMode, onRemove }: Props) {
  const query = useWidgetData<{ quotes: Quote[] }>(
    () => api(`/api/quotes?symbols=${CRYPTO.join(',')}`),
    [],
    { pollMs: 30_000 },
  )

  return (
    <AsyncWidget
      title="Crypto"
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => withPrice(d.quotes).length === 0}
      empty={<EmptyState compact title="Waiting for prices…" />}
    >
      {(d) => (
        <div className="grid grid-cols-2 gap-2">
          {withPrice(d.quotes).map((q) => {
            const up = (q.changePercent ?? 0) >= 0
            return (
              <div
                key={q.symbol}
                className="rounded-lg border border-border bg-surface px-2 py-1.5"
              >
                <div className="text-[11px] text-muted-foreground">
                  {LABEL[q.symbol] ?? q.symbol}
                </div>
                <div className="text-sm font-semibold tabular-nums">{fmtPrice(q.price)}</div>
                <div className={cn('text-[11px] tabular-nums', up ? 'text-up' : 'text-down')}>
                  {fmtSigned(q.changePercent)}%
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AsyncWidget>
  )
}
