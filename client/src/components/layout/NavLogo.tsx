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
        'font-display text-2xl font-light tracking-[0.25em] uppercase transition-colors duration-300 select-none',
        isScrolled
          ? 'text-[var(--color-text-primary)]'
          : 'text-[var(--color-primary-foreground)]'
      )}
    >
      BRAND NAME
    </Link>
  )
}
