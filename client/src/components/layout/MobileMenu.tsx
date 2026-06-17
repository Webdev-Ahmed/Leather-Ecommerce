'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, User, ShoppingBag, LogOut, ChevronRight, ChevronDown, Package, MapPin, Grid2X2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/auth-store'
import { useCartStore, useCartItemCount } from '@/store/cart-store'
import { useAuth } from '@/hooks/useAuth'
import { InitialsAvatar } from '@/components/shared/InitialsAvatar'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/api'

type MobileMenuProps = {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
}

export function MobileMenu({ isOpen, onClose, categories }: MobileMenuProps) {
  const { isAuthenticated, logout } = useAuth()
  const user = useAuthStore((s) => s.user)
  const itemCount = useCartItemCount()
  const openCart = useCartStore((s) => s.openCart)
  const [catOpen, setCatOpen] = useState(true)

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[85] bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel — slides in from left */}
          <motion.div
            key="mobile-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 left-0 bottom-0 z-[90] w-[min(320px,85vw)] bg-[var(--color-primary)] flex flex-col shadow-2xl"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/10 shrink-0">
              <Link
                href="/"
                onClick={onClose}
                className="font-display text-xl font-light tracking-[0.35em] uppercase text-white"
              >
                Leather Co.
              </Link>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* ── Auth strip (if logged in) ── */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-3 px-5 py-4 bg-white/5 border-b border-white/10 shrink-0">
                <InitialsAvatar name={user.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-[var(--font-inter)] font-semibold text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] font-[var(--font-inter)] text-white/40 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            {/* ── Nav links (scrollable) ── */}
            <nav className="flex-1 overflow-y-auto py-3">

              {/* New Arrivals */}
              <Link
                href="/products"
                onClick={onClose}
                className="flex items-center justify-between px-5 py-3.5 text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-white/80 hover:text-[var(--color-accent)] hover:bg-white/5 transition-all border-b border-white/8"
              >
                New Arrivals
                <ChevronRight size={13} strokeWidth={1.5} className="opacity-30" />
              </Link>

              {/* Categories accordion */}
              <div className="border-b border-white/8">
                <button
                  onClick={() => setCatOpen((v) => !v)}
                  className="flex items-center justify-between w-full px-5 py-3.5 text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-white/80 hover:text-[var(--color-accent)] hover:bg-white/5 transition-all"
                >
                  <span>Categories</span>
                  <ChevronDown
                    size={13}
                    strokeWidth={1.5}
                    className={cn(
                      'opacity-40 transition-transform duration-200',
                      catOpen && 'rotate-180'
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {catOpen && (
                    <motion.div
                      key="cat-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pb-2 bg-black/20">
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/categories/${cat.slug}`}
                            onClick={onClose}
                            className="flex items-center gap-3 pl-8 pr-5 py-3 text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] text-white/60 hover:text-[var(--color-accent)] hover:bg-white/5 transition-all"
                          >
                            <span className="w-1 h-1 rounded-full bg-[var(--color-accent)] opacity-60 shrink-0" />
                            {cat.name}
                          </Link>
                        ))}
                        <Link
                          href="/categories"
                          onClick={onClose}
                          className="flex items-center gap-2 pl-8 pr-5 py-3 text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-bold text-[var(--color-accent)] hover:opacity-70 transition-opacity"
                        >
                          <Grid2X2 size={10} strokeWidth={2} />
                          View All
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Account links */}
              {isAuthenticated ? (
                <>
                  <Link
                    href="/account/profile"
                    onClick={onClose}
                    className="flex items-center justify-between px-5 py-3.5 text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-white/80 hover:text-[var(--color-accent)] hover:bg-white/5 transition-all border-b border-white/8"
                  >
                    <span className="flex items-center gap-2.5">
                      <User size={13} strokeWidth={1.5} className="opacity-50" />
                      My Account
                    </span>
                    <ChevronRight size={13} strokeWidth={1.5} className="opacity-30" />
                  </Link>
                  <Link
                    href="/account/orders"
                    onClick={onClose}
                    className="flex items-center justify-between px-5 py-3.5 text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-white/80 hover:text-[var(--color-accent)] hover:bg-white/5 transition-all border-b border-white/8"
                  >
                    <span className="flex items-center gap-2.5">
                      <Package size={13} strokeWidth={1.5} className="opacity-50" />
                      My Orders
                    </span>
                    <ChevronRight size={13} strokeWidth={1.5} className="opacity-30" />
                  </Link>
                  <Link
                    href="/account/addresses"
                    onClick={onClose}
                    className="flex items-center justify-between px-5 py-3.5 text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-white/80 hover:text-[var(--color-accent)] hover:bg-white/5 transition-all border-b border-white/8"
                  >
                    <span className="flex items-center gap-2.5">
                      <MapPin size={13} strokeWidth={1.5} className="opacity-50" />
                      Addresses
                    </span>
                    <ChevronRight size={13} strokeWidth={1.5} className="opacity-30" />
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center justify-between px-5 py-3.5 text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-white/80 hover:text-[var(--color-accent)] hover:bg-white/5 transition-all border-b border-white/8"
                >
                  <span className="flex items-center gap-2.5">
                    <User size={13} strokeWidth={1.5} className="opacity-50" />
                    Sign In
                  </span>
                  <ChevronRight size={13} strokeWidth={1.5} className="opacity-30" />
                </Link>
              )}
            </nav>

            {/* ── Footer actions ── */}
            <div className="border-t border-white/10 px-5 py-4 flex items-center justify-between shrink-0">
              {/* Cart button */}
              <button
                onClick={() => { onClose(); openCart() }}
                aria-label={`Open bag — ${itemCount} items`}
                className="flex items-center gap-2.5 text-white/70 hover:text-white transition-colors group"
              >
                <div className="relative">
                  <ShoppingBag size={20} strokeWidth={1.5} />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] bg-[var(--color-accent)] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold">
                  Bag{itemCount > 0 ? ` (${itemCount})` : ''}
                </span>
              </button>

              {/* Logout if authenticated */}
              {isAuthenticated && (
                <button
                  onClick={() => { onClose(); logout() }}
                  className="flex items-center gap-2 text-white/40 hover:text-red-400 transition-colors"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                  <span className="text-[10px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold">
                    Sign Out
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
