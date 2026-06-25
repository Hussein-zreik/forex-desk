import { ChevronDown } from 'lucide-react'
import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Apply error styling and set `aria-invalid`. Pair with a `Field` error message. */
  invalid?: boolean
  /** Class for the positioning wrapper (controls width; defaults to full-width). */
  wrapperClassName?: string
}

/**
 * Native `<select>` styled to match `Input`. Keeps native a11y + mobile behavior;
 * a decorative chevron is layered on top. Full-width by default; pass
 * `wrapperClassName="w-auto"` for inline/compact use.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, invalid, 'aria-invalid': ariaInvalid, children, ...props }, ref) => (
    <div className={cn('relative inline-flex w-full', wrapperClassName)}>
      <select
        ref={ref}
        aria-invalid={ariaInvalid ?? (invalid || undefined)}
        className={cn(
          'h-10 w-full appearance-none rounded-lg border border-input bg-bg-elevated pl-3 pr-9 text-sm text-foreground',
          'transition-colors duration-200',
          'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          invalid &&
            'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  ),
)
Select.displayName = 'Select'
