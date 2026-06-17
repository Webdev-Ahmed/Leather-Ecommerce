'use client'

import { useProducts } from '@/hooks/useProducts'
import { FeaturedProducts } from './FeaturedProducts'

export function FeaturedProductsWrapper() {
  const { data, isLoading } = useProducts({ isFeatured: true, limit: 8 })

  return (
    <FeaturedProducts
      products={data?.data ?? []}
      isLoading={isLoading}
    />
  )
}
