import { type ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { Spinner } from './Spinner'

export interface AsyncBoundaryProps<T> {
  /** The fetched data. `null`/`undefined` means "not loaded yet". */
  data: T | null | undefined
  loading: boolean
  error?: string | null
  /** Retry handler surfaced by the error state (typically the hook's `refresh`). */
  onRetry?: () => void
  /** Treat loaded data as empty (e.g. `(rows) => rows.length === 0`). */
  isEmpty?: (data: T) => boolean
  /** Override the loading view (e.g. a content-shaped skeleton). */
  skeleton?: ReactNode
  /** Override the empty view. */
  empty?: ReactNode
  /** Use tighter spacing for the default empty/error/loading views (widget bodies). */
  compact?: boolean
  /** Render the data once it's available and non-empty. */
  children: (data: T) => ReactNode
}

/**
 * Declarative loading → error → empty → data ladder. Replaces the hand-written
 * `data ? … : loading ? … : null` conditionals scattered across widgets and pages,
 * guaranteeing consistent loading, error (with retry), and empty handling.
 *
 * Precedence: while nothing has loaded, loading wins, then error. Once data exists
 * it is shown even during background refreshes (stale-while-revalidate), so a failed
 * poll never blanks out good data.
 */
export function AsyncBoundary<T>({
  data,
  loading,
  error,
  onRetry,
  isEmpty,
  skeleton,
  empty,
  compact,
  children,
}: AsyncBoundaryProps<T>) {
  const hasData = data !== null && data !== undefined

  if (!hasData) {
    if (loading) {
      return (
        <>
          {skeleton ?? (
            <div className="flex h-full items-center justify-center p-4">
              <Spinner size="md" label="Loading" />
            </div>
          )}
        </>
      )
    }
    if (error) {
      return <ErrorState message={error} onRetry={onRetry} compact={compact} />
    }
    return <>{empty ?? <EmptyState title="No data" compact={compact} />}</>
  }

  if (isEmpty?.(data)) {
    return <>{empty ?? <EmptyState title="No data" compact={compact} />}</>
  }

  return <>{children(data)}</>
}
