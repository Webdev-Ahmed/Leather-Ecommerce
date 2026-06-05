import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base styles applied to every variant
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tracking-widest uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary: black bg, white text, gold border on hover
        default:
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border border-[var(--color-primary)] hover:border-[var(--color-accent)]',
        // Destructive
        destructive:
          'bg-[var(--color-danger)] text-white hover:opacity-90',
        // Outline: transparent bg, black border, gold on hover
        outline:
          'border border-[var(--color-primary)] bg-transparent text-[var(--color-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
        // Ghost: no border, subtle hover
        ghost:
          'bg-transparent text-[var(--color-text-body)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-primary)]',
        // Link style
        link:
          'bg-transparent text-[var(--color-accent)] underline-offset-4 hover:underline p-0 tracking-normal normal-case',
      },
      size: {
        default: 'h-11 px-8 py-2',
        sm: 'h-9 px-4',
        lg: 'h-13 px-10 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
