import { AlertTriangle } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface ErrorStateProps {
  message?: ReactNode
  /** When provided, renders a "Retry" affordance. */
  onRetry?: () => void
  /** Hide the warning icon (e.g. inside very tight widget bodies). */
  hideIcon?: boolean
  compact?: boolean
  className?: string
}

/**
 * Consistent error placeholder with an optional retry. Announced via `role="alert"`.
 */
export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
  hideIcon,
  compact,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex h-full flex-col items-center justify-center text-center',
        compact ? 'gap-1.5 p-4' : 'gap-2 p-8',
        className,
      )}
    >
      {!hideIcon ? (
        <AlertTriangle
          className={cn('text-muted-foreground/60', compact ? 'h-5 w-5' : 'h-7 w-7')}
          aria-hidden="true"
        />
      ) : null}
      <p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer text-xs font-medium text-primary hover:text-accent-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded"
        >
          Retry
        </button>
      ) : null}
    </div>
  )
}
