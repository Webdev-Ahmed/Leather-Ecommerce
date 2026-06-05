'use client'

import Link from 'next/link'
import { Search, User, ShoppingBag, LogOut, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { useCartStore } from '@/store/cart-store'
import { useAuth } from '@/hooks/useAuth'
import { useState, useRef } from 'react'

type NavIconsProps = {
  isScrolled: boolean
  onSearchOpen: () => void
}

export function NavIcons({ isScrolled, onSearchOpen }: NavIconsProps) {
  const { isAuthenticated, logout } = useAuth()
  const user = useAuthStore((s) => s.user)
  const itemCount = useCartStore((s) => s.itemCount)
  const openCart = useCartStore((s) => s.openCart)

  const [accountOpen, setAccountOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleAccountEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setAccountOpen(true)
  }

  function handleAccountLeave() {
    timeoutRef.current = setTimeout(() => setAccountOpen(false), 150)
  }

  const iconClass = cn(
    'transition-colors duration-200 cursor-pointer',
    isScrolled
      ? 'text-[var(--color-text-primary)] hover:text-[var(--color-accent)]'
      : 'text-[var(--color-primary-foreground)] hover:text-white/70'
  )

  return (
    <div className="flex items-center gap-5">
      {/* Search */}
      <button
        onClick={onSearchOpen}
        aria-label="Open search"
        className={iconClass}
      >
        <Search size={20} strokeWidth={1.5} />
      </button>

      {/* Account */}
      <div
        className="relative"
        onMouseEnter={handleAccountEnter}
        onMouseLeave={handleAccountLeave}
      >
        <button
          aria-label="Account"
          className={iconClass}
          onClick={() => {
            if (!isAuthenticated) window.location.href = '/login'
          }}
        >
          <User size={20} strokeWidth={1.5} />
        </button>

        {isAuthenticated && accountOpen && (
          <div className="absolute top-full right-0 pt-3 z-50 min-w-[180px]">
            <div className="bg-[var(--color-surface-card)] border border-[var(--color-border)] shadow-lg py-2">
              {user && (
                <p className="px-5 py-2 text-[11px] tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)] mb-1 truncate">
                  {user.email}
                </p>
              )}
              <Link
                href="/account/profile"
                className="flex items-center gap-3 px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] text-[var(--color-text-body)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
                onClick={() => setAccountOpen(false)}
              >
                <LayoutDashboard size={14} />
                My Account
              </Link>
              <button
                onClick={() => {
                  setAccountOpen(false)
                  logout()
                }}
                className="flex items-center gap-3 w-full px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] text-[var(--color-text-body)] hover:text-[var(--color-danger)] hover:bg-[var(--color-accent-light)] transition-colors border-t border-[var(--color-border)] mt-1"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cart */}
      <button
        onClick={openCart}
        aria-label={`Open cart — ${itemCount} items`}
        className={cn(iconClass, 'relative')}
      >
        <ShoppingBag size={20} strokeWidth={1.5} />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-[var(--color-accent)] text-white text-[9px] font-medium rounded-full flex items-center justify-center px-1 leading-none">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>
    </div>
  )
}
