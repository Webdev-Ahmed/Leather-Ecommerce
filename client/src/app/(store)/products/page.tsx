import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PLPHeader } from '@/components/product/PLPHeader'
import { PLPClient } from '@/components/product/PLPClient'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'All Products',
  description:
    'Browse our complete range of premium leather wallets, bags, and accessories.',
}

// No revalidate — products page is fully dynamic via client-side TanStack Query
export default function ProductsPage() {
  return (
    <>
      {/* Header is RSC — no searchParams needed */}
      <PLPHeader />

      {/* PLPClient reads searchParams → must be inside Suspense */}
      <Suspense
        fallback={
          <>
            {/* Toolbar skeleton */}
            <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-card)] h-[65px]" />
            {/* Grid skeleton */}
            <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="aspect-[3/4] w-full" />
                    <Skeleton className="h-3 w-3/4 mt-3" />
                    <Skeleton className="h-3 w-1/2 mt-2" />
                  </div>
                ))}
              </div>
            </div>
          </>
        }
      >
        <PLPClient showGenderFilter />
      </Suspense>
    </>
  )
}
