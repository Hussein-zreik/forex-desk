import { useId, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Wiring props a `Field` hands to its control so labels, hints, and errors stay connected. */
export interface FieldControlProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  invalid?: boolean
}

export interface FieldProps {
  label: ReactNode
  /** Error message — when set, the control is marked invalid and the message is announced. */
  error?: string | null
  /** Non-error helper text shown below the control. */
  hint?: ReactNode
  /** Visually hide the label while keeping it available to screen readers. */
  hideLabel?: boolean
  className?: string
  /** Render the control, receiving the id/aria wiring to spread onto it. */
  children: (props: FieldControlProps) => ReactNode
}

/**
 * Accessible label + control + help/error wrapper. Generates a stable id, links the
 * label via `htmlFor`, wires `aria-describedby` to hint/error, and announces errors
 * with `role="alert"`. This is the standard building block for every form input.
 */
export function Field({ label, error, hint, hideLabel, className, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className={cn('text-xs font-medium text-muted-foreground', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        invalid: !!error,
      })}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
