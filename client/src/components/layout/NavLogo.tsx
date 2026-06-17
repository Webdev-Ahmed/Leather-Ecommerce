import Link from 'next/link'
import { cn } from '@/lib/utils'

type NavLogoProps = {
  isScrolled: boolean
  onClose?: () => void
}

export function NavLogo({ isScrolled, onClose }: NavLogoProps) {
  return (
    <Link
      href="/"
      onClick={onClose}
      className={cn(
        'font-display text-[1.15rem] sm:text-[1.25rem] font-light tracking-[0.3em] sm:tracking-[0.35em] uppercase transition-colors duration-300 select-none whitespace-nowrap',
        isScrolled
          ? 'text-[var(--color-text-primary)]'
          : 'text-[var(--color-primary-foreground)]'
      )}
    >
      Leather Co.
    </Link>
  )
}
