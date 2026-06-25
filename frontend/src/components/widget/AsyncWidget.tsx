import { type ReactNode } from 'react'
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { WidgetFrame } from './WidgetFrame'

/** The subset of a `useWidgetData` result an `AsyncWidget` needs. */
export interface WidgetQuery<T> {
  data: T | null | undefined
  loading: boolean
  error: string | null
  refresh: () => void
}

export interface AsyncWidgetProps<T> {
  title: string
  icon?: ReactNode
  editMode?: boolean
  onRemove?: () => void
  /** A `useWidgetData` result; drives the header spinner and the body state ladder. */
  query: WidgetQuery<T>
  /** Treat loaded data as empty (e.g. `(d) => d.items.length === 0`). */
  isEmpty?: (data: T) => boolean
  /** Override the empty body. */
  empty?: ReactNode
  /** Override the loading body (e.g. a content skeleton). */
  skeleton?: ReactNode
  children: (data: T) => ReactNode
}

/**
 * Standard data-driven widget: `WidgetFrame` chrome + `AsyncBoundary` body. Gives every
 * widget identical loading / error (with retry) / empty handling from one declaration,
 * replacing the hand-written `data ? … : loading ? … : null` ladder. The frame's header
 * still shows the refresh control; the boundary owns the body, so errors render once.
 */
export function AsyncWidget<T>({
  title,
  icon,
  editMode,
  onRemove,
  query,
  isEmpty,
  empty,
  skeleton,
  children,
}: AsyncWidgetProps<T>) {
  return (
    <WidgetFrame
      title={title}
      icon={icon}
      editMode={editMode}
      onRemove={onRemove}
      onRefresh={query.refresh}
      loading={query.loading}
    >
      <AsyncBoundary
        data={query.data}
        loading={query.loading}
        error={query.error}
        onRetry={query.refresh}
        isEmpty={isEmpty}
        empty={empty}
        skeleton={skeleton}
        compact
      >
        {children}
      </AsyncBoundary>
    </WidgetFrame>
  )
}
