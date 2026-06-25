import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

const buttonVariants = cva(
  'inline-flex select-none cursor-pointer items-center justify-center gap-2 rounded-lg font-medium ' +
    'transition-[transform,background-color,box-shadow,border-color] duration-200 ease-[var(--ease-expo)] ' +
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none ' +
    'focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-cta hover:bg-accent-bright',
        secondary: 'bg-surface text-foreground shadow-inner-top hover:bg-surface-hover',
        ghost: 'bg-transparent text-muted-foreground hover:bg-surface hover:text-foreground',
        destructive: 'bg-destructive text-primary-foreground hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render as the child element (e.g. a router Link) while keeping button styles. */
  asChild?: boolean
  /** Show a spinner, disable interaction, and mark `aria-busy`. Ignored when `asChild`. */
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      type,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'
    // Slot requires a single child, so the spinner is only injected for a real <button>.
    const typeProp = asChild ? {} : { type: type ?? 'button' }
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        aria-busy={!asChild && loading ? true : undefined}
        disabled={!asChild ? disabled || loading : undefined}
        {...typeProp}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? <Spinner size="sm" label="" className="-ml-0.5" /> : null}
            {children}
          </>
        )}
      </Comp>
    )
  },
)
Button.displayName = 'Button'
