'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type PaginationProps = {
  totalPages: number
  currentPage: number
}

export function Pagination({ totalPages, currentPage }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`${pathname}?${params.toString()}`, { scroll: true })
  }

  // Build visible page numbers — always show first, last, current ±1, with ellipsis
  function getPages(): (number | '…')[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | '…')[] = [1]

    if (currentPage > 3) pages.push('…')

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)

    if (currentPage < totalPages - 2) pages.push('…')
    pages.push(totalPages)

    return pages
  }

  const pages = getPages()

  const btnBase =
    'flex items-center justify-center min-w-[36px] h-9 px-2 text-[11px] tracking-[0.1em] font-[var(--font-inter)] border transition-colors duration-150'

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 py-12"
    >
      {/* Prev */}
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className={cn(
          btnBase,
          'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]',
          currentPage === 1 && 'opacity-30 pointer-events-none'
        )}
      >
        <ChevronLeft size={14} />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span
            key={`ellipsis-${i}`}
            className="flex items-center justify-center min-w-[36px] h-9 text-[11px] text-[var(--color-text-muted)] font-[var(--font-inter)]"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            className={cn(
              btnBase,
              p === currentPage
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                : 'border-[var(--color-border)] text-[var(--color-text-body)] hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className={cn(
          btnBase,
          'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]',
          currentPage === totalPages && 'opacity-30 pointer-events-none'
        )}
      >
        <ChevronRight size={14} />
      </button>
    </nav>
  )
}
