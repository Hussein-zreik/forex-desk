import { useRef, type HTMLAttributes, type MouseEvent } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Render a cursor-tracking radial spotlight on hover. */
  spotlight?: boolean
}

export function Card({ className, spotlight = false, children, onMouseMove, ...props }: CardProps) {
  const ref = useRef<HTMLDivElement>(null)

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    if (spotlight && ref.current) {
      const r = ref.current.getBoundingClientRect()
      ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`)
      ref.current.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    onMouseMove?.(e)
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface to-surface/20 p-6 shadow-card',
        'transition-[border-color,box-shadow] duration-300 ease-[var(--ease-expo)] hover:border-border-hover hover:shadow-card-hover',
        className,
      )}
      {...props}
    >
      {/* top inner-glow hairline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      {spotlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), var(--accent-glow), transparent 70%)',
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  )
}
