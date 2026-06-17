'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { X } from 'lucide-react'

const FILTER_LABELS: Record<string, string> = {
  search: 'Search',
  sort: 'Sort',
  gender: 'Gender',
}

const SORT_LABELS: Record<string, string> = {
  newest: 'Newest',
  price_asc: 'Price: Low–High',
  price_desc: 'Price: High–Low',
}

export function ActiveFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Collect active filter params (excluding page/category, which are structural,
  // and sort=newest, which is the default and not a meaningful "filter")
  const active = Array.from(searchParams.entries()).filter(
    ([key, value]) =>
      !['page', 'category'].includes(key) &&
      !(key === 'sort' && value === 'newest')
  )

  if (active.length === 0) return null

  function removeFilter(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function clearAll() {
    const params = new URLSearchParams()
    // Preserve category param if present — it's structural on the PLP
    const cat = searchParams.get('category')
    if (cat) params.set('category', cat)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function getLabel(key: string, value: string): string {
    if (key === 'sort') return SORT_LABELS[value] ?? value
    return value
  }

  return (
    <div className="flex items-center gap-2 flex-wrap py-3">
      <span className="text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)] mr-1">
        Active:
      </span>

      {active.map(([key, value]) => (
        <button
          key={key}
          onClick={() => removeFilter(key)}
          className="inline-flex items-center gap-1.5 h-7 px-3 border border-[var(--color-border)] text-[10px] tracking-[0.15em] uppercase font-[var(--font-inter)] text-[var(--color-text-body)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] transition-colors"
        >
          <span className="text-[var(--color-text-muted)]">
            {FILTER_LABELS[key] ?? key}:
          </span>
          {getLabel(key, value)}
          <X size={10} />
        </button>
      ))}

      {active.length > 1 && (
        <button
          onClick={clearAll}
          className="text-[10px] tracking-[0.15em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors ml-1 underline underline-offset-2"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
