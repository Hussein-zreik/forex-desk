import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-border-accent bg-surface px-2.5 py-0.5',
        'font-mono text-xs tracking-widest text-muted-foreground uppercase',
        className,
      )}
      {...props}
    />
  )
}
