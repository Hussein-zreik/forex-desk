import { Slot } from '@radix-ui/react-slot'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex select-none cursor-pointer items-center justify-center gap-2 rounded-lg font-medium ' +
  'transition-[transform,background-color,box-shadow,border-color] duration-200 ease-[var(--ease-expo)] ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

const variantStyles: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground shadow-cta hover:bg-accent-bright',
  secondary: 'bg-surface text-foreground shadow-inner-top hover:bg-surface-hover',
  ghost: 'bg-transparent text-muted-foreground hover:bg-surface hover:text-foreground',
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Render as the child element (e.g. a router Link) while keeping button styles. */
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    const typeProp = asChild ? {} : { type: type ?? 'button' }
    return (
      <Comp
        ref={ref}
        className={cn(base, variantStyles[variant], sizeStyles[size], className)}
        {...typeProp}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'
