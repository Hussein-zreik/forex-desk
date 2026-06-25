import { type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface EmptyStateProps {
  /** Optional lucide icon rendered above the title. */
  icon?: LucideIcon
  title: ReactNode
  description?: ReactNode
  /** Optional call-to-action (e.g. a Button) rendered below the description. */
  action?: ReactNode
  /** Compact spacing for tight containers like widget bodies. */
  compact?: boolean
  className?: string
}

/**
 * Consistent "nothing here yet" placeholder. Use for empty lists/tables/widgets so
 * empty copy and layout stay uniform across the app.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center text-center',
        compact ? 'gap-1.5 p-4' : 'gap-2 p-8',
        className,
      )}
    >
      {Icon ? (
        <Icon
          className={cn('text-muted-foreground/60', compact ? 'h-6 w-6' : 'h-8 w-8')}
          aria-hidden="true"
        />
      ) : null}
      <p className={cn('font-medium text-foreground', compact ? 'text-xs' : 'text-sm')}>{title}</p>
      {description ? (
        <p className={cn('text-muted-foreground', compact ? 'text-[11px]' : 'text-sm')}>
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
