'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

export function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('search') ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local state if URL changes externally (e.g. clear-all from ActiveFilters)
  useEffect(() => {
    setValue(searchParams.get('search') ?? '')
  }, [searchParams])

  function pushSearch(query: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (query.trim()) {
      params.set('search', query.trim())
    } else {
      params.delete('search')
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setValue(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => pushSearch(next), 400)
  }

  function handleClear() {
    setValue('')
    if (timerRef.current) clearTimeout(timerRef.current)
    pushSearch('')
  }

  return (
    <div className="relative">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search products…"
        aria-label="Search products"
        className="h-9 w-full sm:w-56 bg-transparent border border-[var(--color-border)] text-[12px] font-[var(--font-inter)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] pl-9 pr-8 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
      />
      {value && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
