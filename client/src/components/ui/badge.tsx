import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wider uppercase',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
        success:
          'bg-[#DCFCE7] text-[var(--color-success)]',
        danger:
          'bg-[#FEE2E2] text-[var(--color-danger)]',
        warning:
          'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
        muted:
          'bg-[#F1F0EE] text-[var(--color-text-muted)]',
        outline:
          'border border-[var(--color-border)] text-[var(--color-text-muted)] bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
