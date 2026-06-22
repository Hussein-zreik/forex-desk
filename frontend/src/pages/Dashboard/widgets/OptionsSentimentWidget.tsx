import { Sparkline } from '@/components/widget/Sparkline'
import { WidgetFrame } from '@/components/widget/WidgetFrame'
import { WidgetLoading } from '@/components/widget/WidgetLoading'
import { useWidgetData } from '@/hooks/useWidgetData'
import { api } from '@/lib/api'
import { cn } from '@/lib/cn'

interface OptionsData {
  ratio?: number
  date?: string
  sentiment?: string
  history?: number[]
  error?: string
}

const SENTIMENT_STYLE: Record<string, string> = {
  Fear: 'text-down',
  Greed: 'text-up',
  Neutral: 'text-muted-foreground',
}

interface Props {
  editMode?: boolean
  onRemove?: () => void
}

export function OptionsSentimentWidget({ editMode, onRemove }: Props) {
  const { data, loading, error, refresh } = useWidgetData<OptionsData>(
    () => api('/api/options-sentiment'),
    [],
    { pollMs: 3_600_000 },
  )

  return (
    <WidgetFrame
      title="Options Sentiment"
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={refresh}
      loading={loading}
      error={data?.error ? 'CBOE data unavailable' : error}
    >
      {data && data.ratio != null ? (
        <div className="flex h-full flex-col items-center justify-center">
          <div className="text-3xl font-semibold tabular-nums">{data.ratio.toFixed(2)}</div>
          <div className="mt-1 text-[11px] tracking-wide text-muted-foreground">
            CBOE total put/call ratio
          </div>
          <div
            className={cn(
              'mt-2 text-sm font-medium',
              SENTIMENT_STYLE[data.sentiment ?? 'Neutral'] ?? 'text-muted-foreground',
            )}
          >
            {data.sentiment ?? 'Neutral'}
          </div>
          {data.history && data.history.length > 1 && (
            <Sparkline
              values={data.history}
              color={
                data.sentiment === 'Fear'
                  ? 'var(--down)'
                  : data.sentiment === 'Greed'
                    ? 'var(--up)'
                    : 'var(--primary)'
              }
              className="mt-3 h-7 w-full"
            />
          )}
        </div>
      ) : loading ? (
        <WidgetLoading />
      ) : null}
    </WidgetFrame>
  )
}
