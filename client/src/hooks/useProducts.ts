'use client'

import { useQuery } from '@tanstack/react-query'
import { getProducts, getProduct } from '@/api/products'
import type { ProductsQuery } from '@/types/api'

export function useProducts(query: ProductsQuery = {}) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => getProducts(query),
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug),
    enabled: Boolean(slug),
  })
}
