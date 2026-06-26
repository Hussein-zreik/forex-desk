import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

export interface SegmentedOption<V extends string> {
  value: V
  label: string
}

export interface SegmentedControlProps<V extends string> {
  options: SegmentedOption<V>[]
  value: V
  onChange: (value: V) => void
  /** Accessible group label (e.g. "Impact filter"). */
  label: string
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Single-select filter group with roving-tabindex keyboard navigation
 * (arrow keys + Home/End), exposed as an ARIA radiogroup. Replaces ad-hoc rows of
 * highlighted filter buttons.
 */
export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className,
}: SegmentedControlProps<V>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function focusIndex(i: number) {
    const next = (i + options.length) % options.length
    refs.current[next]?.focus()
    onChange(options[next].value)
  }

  function onKeyDown(e: KeyboardEvent, i: number) {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        focusIndex(i + 1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        focusIndex(i - 1)
        break
      case 'Home':
        e.preventDefault()
        focusIndex(0)
        break
      case 'End':
        e.preventDefault()
        focusIndex(options.length - 1)
        break
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex flex-wrap gap-1 rounded-lg bg-surface p-1', className)}
    >
      {options.map((opt, i) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'cursor-pointer rounded-md font-medium transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              active
                ? 'bg-primary text-primary-foreground shadow-cta'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
