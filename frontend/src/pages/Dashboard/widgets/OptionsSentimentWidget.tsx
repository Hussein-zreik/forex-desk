import { EmptyState } from '@/components/ui/EmptyState'
import { AsyncWidget } from '@/components/widget/AsyncWidget'
import { SourceLink } from '@/components/widget/SourceLink'
import { Sparkline } from '@/components/widget/Sparkline'
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
  const query = useWidgetData<OptionsData>(() => api('/api/options-sentiment'), [], {
    pollMs: 3_600_000,
  })

  return (
    <AsyncWidget
      title="Options Sentiment"
      editMode={editMode}
      onRemove={onRemove}
      query={query}
      isEmpty={(d) => !!d.error || d.ratio == null}
      empty={<EmptyState compact title="CBOE data unavailable" />}
    >
      {(data) => (
        <div className="flex h-full flex-col items-center justify-center">
          <div className="text-3xl font-semibold tabular-nums">{data.ratio!.toFixed(2)}</div>
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
          <SourceLink
            name="CBOE"
            href="https://www.cboe.com/us/options/market_statistics/daily/"
          />
        </div>
      )}
    </AsyncWidget>
  )
}
