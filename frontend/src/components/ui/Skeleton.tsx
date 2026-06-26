import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type SkeletonProps = HTMLAttributes<HTMLDivElement>

/**
 * Shimmering placeholder block for content-shaped loading states.
 * Decorative by default (`aria-hidden`); the surrounding region should own the
 * `aria-busy`/status announcement.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-surface-hover', className)}
      {...props}
    />
  ),
)
Skeleton.displayName = 'Skeleton'

export interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of shimmer lines to render. */
  lines?: number
}

/** A stack of text-line skeletons; the last line is shortened to read as a paragraph. */
export function SkeletonText({ lines = 3, className, ...props }: SkeletonTextProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-hidden="true" {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 && lines > 1 && 'w-2/3')} />
      ))}
    </div>
  )
}
