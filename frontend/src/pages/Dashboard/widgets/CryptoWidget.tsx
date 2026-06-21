import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
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

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function CryptoWidget({ editMode, onRemove }: Props) {
  const { data, loading, error, refresh } = useWidgetData<{ quotes: Quote[] }>(
    () => api(`/api/quotes?symbols=${CRYPTO.join(',')}`),
    [],
    { pollMs: 30_000 },
  )
  const quotes = (data?.quotes ?? []).filter((q) => q.price != null)

  return (
    <WidgetFrame
      title="Crypto"
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={error}
    >
      {quotes.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {quotes.map((q) => {
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
      ) : loading ? (
        <WidgetLoading />
      ) : null}
    </WidgetFrame>
  )
}
