'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScrolled } from '@/hooks/useScrolled'
import { NavLogo } from './NavLogo'
import { NavIcons } from './NavIcons'
import { CategoryDropdown } from './CategoryDropdown'
import { MobileMenu } from './MobileMenu'
import { SearchOverlay } from './SearchOverlay'
import type { Category } from '@/types/api'
import Link from 'next/link'

type NavClientProps = {
  categories: Category[]
}

export function NavClient({ categories }: NavClientProps) {
  const isScrolled = useScrolled(80)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const navBase = cn(
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
    isScrolled
      ? 'bg-[var(--color-surface-card)] border-b border-[var(--color-border)] shadow-sm'
      : 'bg-transparent'
  )

  const linkClass = cn(
    'text-[11px] tracking-[0.18em] uppercase font-[var(--font-inter)] font-medium transition-colors duration-200',
    isScrolled
      ? 'text-[var(--color-text-primary)] hover:text-[var(--color-accent)]'
      : 'text-[var(--color-primary-foreground)] hover:text-white/70'
  )

  return (
    <>
      <header className={navBase}>
        <nav className="max-w-[1400px] mx-auto px-6 lg:px-10">
          {/* Desktop layout: three-column grid — links | logo | icons */}
          <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center h-[72px]">
            {/* Left: nav links */}
            <div className="flex items-center gap-8">
              <Link href="/products" className={linkClass}>
                New Arrivals
              </Link>
              <CategoryDropdown
                label="Men"
                categories={categories.filter(
                  (c) => c.gender === 'MEN' || c.gender === null
                )}
                isScrolled={isScrolled}
              />
              <CategoryDropdown
                label="Women"
                categories={categories.filter(
                  (c) => c.gender === 'WOMEN' || c.gender === null
                )}
                isScrolled={isScrolled}
              />
              <Link href="/categories" className={linkClass}>
                All Categories
              </Link>
            </div>

            {/* Centre: logo */}
            <NavLogo isScrolled={isScrolled} />

            {/* Right: icons */}
            <div className="flex justify-end">
              <NavIcons
                isScrolled={isScrolled}
                onSearchOpen={() => setSearchOpen(true)}
              />
            </div>
          </div>

          {/* Mobile layout: hamburger | logo | cart */}
          <div className="flex lg:hidden items-center justify-between h-[60px]">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className={cn(
                'transition-colors duration-200',
                isScrolled
                  ? 'text-[var(--color-text-primary)]'
                  : 'text-[var(--color-primary-foreground)]'
              )}
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>

            <NavLogo isScrolled={isScrolled} onClose={() => {}} />

            <NavIcons
              isScrolled={isScrolled}
              onSearchOpen={() => setSearchOpen(true)}
            />
          </div>
        </nav>
      </header>

      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        categories={categories}
      />

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  )
}
