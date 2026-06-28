import { GripVertical, RefreshCw, X } from 'lucide-react'
import { type ReactNode } from 'react'
import { ErrorState } from '@/components/ui/ErrorState'
import { cn } from '@/lib/cn'
import { fmtAgo } from '@/lib/format'

interface Props {
  title: string
  icon?: ReactNode
  editMode?: boolean
  loading?: boolean
  error?: string | null
  /** Epoch ms of the last successful fetch; shows a subtle freshness label. */
  updatedAt?: number | null
  onRefresh?: () => void
  onRemove?: () => void
  children: ReactNode
}

export function WidgetFrame({
  title,
  icon,
  editMode = false,
  loading = false,
  error = null,
  updatedAt = null,
  onRefresh,
  onRemove,
  children,
}: Props) {
  const ago = !editMode && updatedAt ? fmtAgo(updatedAt) : ''
  return (
    <div
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-xl border border-border shadow-card transition-[transform,box-shadow,border-color] duration-300 ease-expo will-change-transform hover:-translate-y-[3px] hover:border-border-hover hover:shadow-card-hover',
        editMode && 'cursor-move',
      )}
      style={{
        backgroundImage: 'var(--card-grad)',
        backdropFilter: 'blur(var(--card-blur))',
        WebkitBackdropFilter: 'blur(var(--card-blur))',
      }}
    >
      {/* faint top-edge highlight to lift the card off the background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      />
      <div
        className={cn(
          'widget-drag-handle flex items-center gap-1.5 border-b border-border px-4 py-2.5',
          editMode && 'cursor-move',
        )}
      >
        {editMode && <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        {icon}
        <h3 className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </h3>
        <div className="no-drag ml-auto flex items-center gap-1">
          {ago && (
            <span
              className="mr-0.5 text-[10px] tabular-nums text-muted-foreground"
              title="Last updated"
            >
              {ago}
            </span>
          )}
          {onRefresh && !editMode && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label={`Refresh ${title}`}
              className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </button>
          )}
          {editMode && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${title}`}
              className="cursor-pointer rounded p-1 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-auto p-4">
        {error ? <ErrorState message={error} onRetry={onRefresh} compact /> : children}
      </div>
    </div>
  )
}
