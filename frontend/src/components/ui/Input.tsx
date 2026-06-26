import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Apply error styling and set `aria-invalid`. Pair with a `Field` error message. */
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', invalid, 'aria-invalid': ariaInvalid, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={ariaInvalid ?? (invalid || undefined)}
      className={cn(
        'h-10 w-full rounded-lg border border-input bg-bg-elevated px-3 text-sm text-foreground',
        'transition-colors duration-200 placeholder:text-muted-foreground',
        'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid &&
          'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
