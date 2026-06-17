'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown, ArrowRight, LayoutGrid } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/api'

type CategoryDropdownProps = {
  label: string
  categories: Category[]
  isScrolled: boolean
}

export function CategoryDropdown({
  label,
  categories,
  isScrolled,
}: CategoryDropdownProps) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  const triggerClass = cn(
    'flex items-center gap-1 text-[11px] tracking-[0.18em] uppercase font-[var(--font-inter)] font-medium transition-colors duration-200 py-1 cursor-pointer select-none',
    isScrolled
      ? 'text-[var(--color-text-primary)] hover:text-[var(--color-accent)]'
      : 'text-[var(--color-primary-foreground)] hover:text-white/70',
    open && isScrolled && 'text-[var(--color-accent)]',
    open && !isScrolled && 'text-white/70',
  )

  return (
    <div
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true) }}
      onMouseLeave={scheduleClose}
    >
      {/* Trigger */}
      <button
        type="button"
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronDown
          size={11}
          strokeWidth={2}
          className={cn(
            'mt-px transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Panel — rendered via AnimatePresence so it fully unmounts when closed */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            /* pt-3 creates a transparent hover bridge between button and panel */
            className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-[200]"
            style={{ minWidth: '300px' }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <div className="bg-white border border-[var(--color-border)] shadow-[0_16px_48px_-8px_rgba(0,0,0,0.2)]">
              {/* Gold top accent */}
              <div className="h-[2px] bg-gradient-to-r from-[var(--color-accent)] to-transparent" />

              <div className="p-4">
                {/* Section label */}
                <p className="text-[9px] tracking-[0.3em] uppercase font-[var(--font-inter)] font-bold text-[var(--color-text-muted)] mb-3">
                  {label}&rsquo;s Collection
                </p>

                {/* Category grid */}
                <div className="grid grid-cols-2 gap-0.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.slug}`}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-2.5 px-3 py-2.5 hover:bg-[var(--color-accent-light)] transition-colors duration-150"
                    >
                      <span className="w-1 h-1 rounded-full bg-[var(--color-border)] group-hover:bg-[var(--color-accent)] transition-colors shrink-0" />
                      <span className="text-[11px] tracking-[0.1em] uppercase font-[var(--font-inter)] font-medium text-[var(--color-text-body)] group-hover:text-[var(--color-primary)] transition-colors leading-tight">
                        {cat.name}
                      </span>
                    </Link>
                  ))}
                </div>

                {/* Footer CTA */}
                <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <Link
                    href="/categories"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between w-full px-3 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-accent)] transition-colors duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <LayoutGrid size={11} strokeWidth={1.5} className="text-white/60" />
                      <span className="text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-bold text-white">
                        All Categories
                      </span>
                    </span>
                    <ArrowRight
                      size={12}
                      strokeWidth={2}
                      className="text-white/60 group-hover:translate-x-0.5 transition-transform"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
