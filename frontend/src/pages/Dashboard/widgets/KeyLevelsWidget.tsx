import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { fmtPrice } from '@/lib/format'

interface KLData {
  symbol: string
  price?: number
  resistance?: number[]
  support?: number[]
  error?: string
}

interface Props {
  symbol?: string
  title?: string
  editMode?: boolean
  onRemove?: () => void
}

export function KeyLevelsWidget({
  symbol = 'XAU=F',
  title = 'Key Levels — Gold',
  editMode,
  onRemove,
}: Props) {
  const { data, loading, error, refresh } = useWidgetData<KLData>(
    () => api(`/api/indicators/key-levels?symbol=${encodeURIComponent(symbol)}`),
    [symbol],
    { pollMs: 300_000 },
  )

  const resistance = [...(data?.resistance ?? [])].sort((a, b) => b - a)
  const support = [...(data?.support ?? [])].sort((a, b) => b - a)

  return (
    <WidgetFrame
      title={title}
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={data?.error ? 'Levels unavailable' : error}
    >
      {data && data.price != null ? (
        <ul className="flex h-full flex-col justify-center gap-1 text-sm">
          {resistance.map((r) => (
            <li key={`r${r}`} className="flex items-center justify-between text-up">
              <span className="text-[10px] uppercase opacity-70">R</span>
              <span className="tabular-nums">{fmtPrice(r)}</span>
            </li>
          ))}
          <li className="flex items-center justify-between border-y border-border py-1 font-semibold text-primary">
            <span className="text-[10px] uppercase opacity-70">Price</span>
            <span className="tabular-nums">{fmtPrice(data.price)}</span>
          </li>
          {support.map((s) => (
            <li key={`s${s}`} className="flex items-center justify-between text-down">
              <span className="text-[10px] uppercase opacity-70">S</span>
              <span className="tabular-nums">{fmtPrice(s)}</span>
            </li>
          ))}
        </ul>
      ) : loading ? (
        <WidgetLoading />
      ) : null}
    </WidgetFrame>
  )
}
