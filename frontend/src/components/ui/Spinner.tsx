import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const spinnerVariants = cva(
  'inline-block animate-spin rounded-full border-border border-t-primary',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        md: 'h-5 w-5 border-2',
        lg: 'h-8 w-8 border-[3px]',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export interface SpinnerProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'>, VariantProps<typeof spinnerVariants> {
  /** Accessible label announced to screen readers. */
  label?: string
}

/**
 * Indeterminate loading indicator. Announces itself via `role="status"`.
 * Pass `label=""` to silence it when a parent already conveys the loading state.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size, label = 'Loading', ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <span className={cn(spinnerVariants({ size }))} />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  ),
)
Spinner.displayName = 'Spinner'
