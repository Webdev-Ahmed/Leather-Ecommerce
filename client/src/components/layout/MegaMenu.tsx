'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/types/api'

const SECTION_COPY: Record<string, { headline: string; sub: string }> = {
  Men: {
    headline: 'Crafted for Him',
    sub: 'Wallets, belts, bags & accessories — built to last a lifetime.',
  },
  Women: {
    headline: 'Refined Femininity',
    sub: 'Bags, clutches, card holders & more in premium full-grain leather.',
  },
}

type MegaMenuProps = {
  activeLabel: string | null
  /** Total top offset in px (announcement bar + nav height) so the panel
   *  sits exactly flush below the nav bar. */
  topOffset: number
  categories: Category[]
  isScrolled: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClose: () => void
}

export function MegaMenu({
  activeLabel,
  topOffset,
  categories,
  isScrolled,
  onMouseEnter,
  onMouseLeave,
  onClose,
}: MegaMenuProps) {
  const copy = activeLabel
    ? (SECTION_COPY[activeLabel] ?? { headline: activeLabel, sub: '' })
    : null

  return (
    <AnimatePresence>
      {activeLabel && (
        <>
          {/*
           * The panel is position:fixed, z-[200] — independent of the header's
           * stacking context so no z-index scoping issues.
           * topOffset = announcementBar + navHeight so it sits flush below the nav.
           */}
          <motion.div
            key="mega-panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{ top: topOffset }}
            className="fixed left-0 right-0 z-[200]"
          >
            {/* Gold accent line at very top */}
            <div className="h-[2px] bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent)]/50 to-transparent" />

            <div
              className={cn(
                'w-full shadow-[0_24px_60px_-12px_rgba(0,0,0,0.2)]',
                isScrolled
                  ? 'bg-white border-b border-[var(--color-border)]'
                  : 'bg-[var(--color-primary)] border-b border-white/10',
              )}
            >
              <div className="max-w-[1400px] mx-auto px-10 py-10">
                <div className="grid grid-cols-[220px_1fr] gap-12">

                  {/* ── Left editorial panel — crossfades per active label ── */}
                  <div
                    className={cn(
                      'pr-12 flex flex-col justify-between border-r',
                      isScrolled
                        ? 'border-[var(--color-border)]'
                        : 'border-white/10',
                    )}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeLabel}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                      >
                        <p className="text-[9px] tracking-[0.35em] uppercase font-[var(--font-inter)] font-bold text-[var(--color-accent)] mb-3">
                          {activeLabel}&apos;s Collection
                        </p>
                        <h3
                          className={cn(
                            'font-display text-[2rem] font-light leading-tight tracking-[0.06em] mb-3',
                            isScrolled ? 'text-[var(--color-primary)]' : 'text-white',
                          )}
                        >
                          {copy?.headline}
                        </h3>
                        <p
                          className={cn(
                            'text-[12px] font-[var(--font-inter)] leading-relaxed',
                            isScrolled
                              ? 'text-[var(--color-text-muted)]'
                              : 'text-white/50',
                          )}
                        >
                          {copy?.sub}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    <Link
                      href="/categories"
                      onClick={onClose}
                      className={cn(
                        'group inline-flex items-center gap-2 mt-8 text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-bold transition-colors',
                        isScrolled
                          ? 'text-[var(--color-primary)] hover:text-[var(--color-accent)]'
                          : 'text-white/60 hover:text-[var(--color-accent)]',
                      )}
                    >
                      View All
                      <ArrowRight
                        size={11}
                        strokeWidth={2.5}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </Link>
                  </div>

                  {/* ── Right: category grid — content crossfades per label ── */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeLabel}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.14, ease: 'easeOut' }}
                      className="grid grid-cols-3 xl:grid-cols-4 gap-x-2 gap-y-0.5 content-start"
                    >
                      {categories.map((cat, i) => (
                        <motion.div
                          key={cat.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.18,
                            delay: i * 0.022,
                            ease: 'easeOut',
                          }}
                        >
                          <Link
                            href={`/categories/${cat.slug}`}
                            onClick={onClose}
                            className={cn(
                              'group flex items-center gap-3 px-3 py-3 transition-colors duration-150',
                              isScrolled
                                ? 'hover:bg-[var(--color-accent-light)]'
                                : 'hover:bg-white/8',
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200',
                                isScrolled
                                  ? 'bg-[var(--color-border)] group-hover:bg-[var(--color-accent)]'
                                  : 'bg-white/20 group-hover:bg-[var(--color-accent)]',
                              )}
                            />
                            <span
                              className={cn(
                                'text-[11px] tracking-[0.12em] uppercase font-[var(--font-inter)] font-medium transition-colors leading-tight',
                                isScrolled
                                  ? 'text-[var(--color-text-body)] group-hover:text-[var(--color-primary)]'
                                  : 'text-white/65 group-hover:text-white',
                              )}
                            >
                              {cat.name}
                            </span>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>

                </div>
              </div>
            </div>
          </motion.div>

          {/*
           * Backdrop — z-[199], one below the panel so it never covers it.
           * Clicking outside closes the menu.
           */}
          <motion.div
            key="mega-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ top: topOffset }}
            className="fixed inset-x-0 bottom-0 z-[199]"
            aria-hidden="true"
            onClick={onClose}
          />
        </>
      )}
    </AnimatePresence>
  )
}
