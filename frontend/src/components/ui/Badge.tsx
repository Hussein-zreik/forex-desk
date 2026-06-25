import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs tracking-widest uppercase',
  {
    variants: {
      variant: {
        neutral: 'border-border-accent bg-surface text-muted-foreground',
        up: 'border-up/30 bg-up/10 text-up',
        down: 'border-down/30 bg-down/10 text-down',
        accent: 'border-primary/40 bg-primary/10 text-primary',
        warn: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  ),
)
Badge.displayName = 'Badge'
