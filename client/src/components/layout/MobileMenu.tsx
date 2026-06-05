'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { X, User, ShoppingBag, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/auth-store'
import { useCartStore } from '@/store/cart-store'
import { useAuth } from '@/hooks/useAuth'
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
  const itemCount = useCartStore((s) => s.itemCount)
  const openCart = useCartStore((s) => s.openCart)

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const linkClass =
    'block text-[13px] tracking-[0.2em] uppercase font-[var(--font-inter)] text-white/80 hover:text-[var(--color-accent)] transition-colors py-3 border-b border-white/10'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] bg-[var(--color-primary)] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <Link
              href="/"
              onClick={onClose}
              className="font-display text-xl font-light tracking-[0.25em] uppercase text-white"
            >
              BRAND NAME
            </Link>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="text-white/60 hover:text-white transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-6 py-4">
            <Link href="/products" className={linkClass} onClick={onClose}>
              New Arrivals
            </Link>
            <div className="py-2">
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/40 font-[var(--font-inter)] mb-1">
                Categories
              </p>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className={cn(linkClass, 'pl-3')}
                  onClick={onClose}
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/categories"
                className={cn(linkClass, 'pl-3 text-white/50')}
                onClick={onClose}
              >
                View All Categories
              </Link>
            </div>
          </nav>

          {/* Bottom icons row */}
          <div className="border-t border-white/10 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/account/profile"
                    onClick={onClose}
                    aria-label="My account"
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <User size={20} strokeWidth={1.5} />
                  </Link>
                  <button
                    onClick={() => {
                      onClose()
                      logout()
                    }}
                    aria-label="Logout"
                    className="text-white/70 hover:text-[var(--color-danger)] transition-colors"
                  >
                    <LogOut size={20} strokeWidth={1.5} />
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={onClose}
                  aria-label="Login"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <User size={20} strokeWidth={1.5} />
                </Link>
              )}
            </div>

            {user && (
              <p className="text-[11px] text-white/40 font-[var(--font-inter)] truncate max-w-[160px]">
                {user.name}
              </p>
            )}

            <button
              onClick={() => {
                onClose()
                openCart()
              }}
              aria-label={`Cart — ${itemCount} items`}
              className="relative text-white/70 hover:text-white transition-colors"
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-[var(--color-accent)] text-white text-[9px] font-medium rounded-full flex items-center justify-center px-1 leading-none">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
