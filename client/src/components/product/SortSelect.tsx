'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronDown, Check, ArrowDownUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ProductsQuery } from '@/types/api'

type SortValue = NonNullable<ProductsQuery['sort']>

const OPTIONS: { label: string; value: SortValue }[] = [
  { label: 'Newest',            value: 'newest'     },
  { label: 'Price: Low to High', value: 'price_asc'  },
  { label: 'Price: High to Low', value: 'price_desc' },
]

export function SortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = (searchParams.get('sort') as SortValue | null) ?? 'newest'
  const activeOption = OPTIONS.find((o) => o.value === active) ?? OPTIONS[0]

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  function handleSelect(value: SortValue) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    setOpen(false)
  }

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "h-9 flex items-center gap-2.5 border text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] text-[var(--color-text-body)] pl-4 pr-3.5 transition-colors duration-150",
          open
            ? "border-[var(--color-primary)]"
            : "border-[var(--color-border)] hover:border-[var(--color-text-primary)]",
        )}
      >
        <ArrowDownUp size={12} strokeWidth={1.5} className="text-[var(--color-text-muted)] shrink-0" />
        <span className="whitespace-nowrap">{activeOption.label}</span>
        <ChevronDown
          size={13}
          strokeWidth={1.5}
          className={cn("text-[var(--color-text-muted)] transition-transform duration-200 shrink-0", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="sort-panel"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            role="listbox"
            className="absolute top-full right-0 mt-2 z-[100] bg-white border border-[var(--color-border)] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.15)] min-w-[200px]"
          >
            {OPTIONS.map((o) => {
              const isActive = o.value === active
              return (
                <button
                  key={o.value}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(o.value)}
                  className={cn(
                    "group flex items-center justify-between w-full px-4 py-2.5 text-left text-[11px] tracking-[0.1em] uppercase font-[var(--font-inter)] transition-colors duration-150",
                    isActive
                      ? "bg-[var(--color-accent-light)] text-[var(--color-primary)] font-semibold"
                      : "text-[var(--color-text-body)] hover:bg-[var(--color-surface)]",
                  )}
                >
                  {o.label}
                  {isActive && <Check size={13} strokeWidth={2} className="text-[var(--color-accent)]" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
