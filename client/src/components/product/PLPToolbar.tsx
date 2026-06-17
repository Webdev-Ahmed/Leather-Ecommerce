'use client'

import { useSearchParams } from 'next/navigation'
import { SearchBar } from './SearchBar'
import { SortSelect } from './SortSelect'
import { GenderFilter } from '@/components/category/GenderFilter'

type PLPToolbarProps = {
  total: number
  showGenderFilter?: boolean
}

export function PLPToolbar({ total, showGenderFilter = true }: PLPToolbarProps) {
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page') ?? 1)
  const limit = 24

  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-card)]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Top row: search + sort */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <SearchBar />
            {showGenderFilter && <GenderFilter />}
          </div>
          <div className="flex items-center gap-4">
            {total > 0 && (
              <p className="text-[11px] tracking-[0.1em] font-[var(--font-inter)] text-[var(--color-text-muted)] hidden sm:block">
                {from}–{to} of {total}
              </p>
            )}
            <SortSelect />
          </div>
        </div>
      </div>
    </div>
  )
}
