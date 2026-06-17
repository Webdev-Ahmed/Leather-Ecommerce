'use client'

import { motion } from 'framer-motion'
import { PackageSearch } from 'lucide-react'
import { ProductCard } from '@/components/shared/ProductCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { Product } from '@/types/api'

type ProductGridProps = {
  products: Product[]
  isLoading: boolean
  isFetching?: boolean
}

const SKELETON_COUNT = 24

export function ProductGrid({ products, isLoading, isFetching = false }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[3/4] w-full" />
            <Skeleton className="h-3 w-3/4 mt-3" />
            <Skeleton className="h-3 w-1/2 mt-2" />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <PackageSearch
          size={40}
          strokeWidth={1}
          className="text-[var(--color-border)]"
        />
        <p className="text-[11px] tracking-[0.25em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)]">
          No products found
        </p>
        <p className="text-sm font-[var(--font-inter)] text-[var(--color-text-muted)]">
          Try adjusting your search or filters
        </p>
      </div>
    )
  }

  return (
    <div
      className={[
        'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10',
        isFetching ? 'opacity-60 pointer-events-none transition-opacity' : '',
      ].join(' ')}
    >
      {products.map((product, i) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(i, 7) * 0.04 }}
        >
          <ProductCard product={product} priority={i < 8} />
        </motion.div>
      ))}
    </div>
  )
}
