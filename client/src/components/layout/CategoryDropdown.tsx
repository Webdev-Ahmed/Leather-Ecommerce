'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  const linkClass = cn(
    'flex items-center gap-0.5 text-[11px] tracking-[0.18em] uppercase font-[var(--font-inter)] font-medium transition-colors duration-200',
    isScrolled
      ? 'text-[var(--color-text-primary)] hover:text-[var(--color-accent)]'
      : 'text-[var(--color-primary-foreground)] hover:text-white/70'
  )

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className={linkClass} aria-expanded={open}>
        {label}
        <ChevronDown
          size={12}
          className={cn(
            'mt-px transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50 min-w-[180px]">
          <ul className="bg-[var(--color-surface-card)] border border-[var(--color-border)] shadow-lg py-2">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/categories/${cat.slug}`}
                  className="block px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] text-[var(--color-text-body)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/categories"
                className="block px-5 py-2.5 text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors border-t border-[var(--color-border)] mt-1 pt-3"
                onClick={() => setOpen(false)}
              >
                All Categories
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
