'use client'

import { useQuery } from '@tanstack/react-query'
import { getCategories, getCategory } from '@/api/categories'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: () => getCategory(slug),
    enabled: Boolean(slug),
  })
}
