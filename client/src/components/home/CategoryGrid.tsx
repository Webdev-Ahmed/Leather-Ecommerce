'use client'

import { motion } from 'framer-motion'
import { CategoryCard } from '@/components/shared/CategoryCard'
import type { Category } from '@/types/api'

type CategoryGridProps = {
  categories: Category[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) return null

  // Show up to 6 categories in a 3-col grid (2 rows), matching the HUB reference
  const visible = categories.slice(0, 6)

  return (
    <section className="w-full">
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        style={{ gridAutoRows: '1fr' }}
      >
        {visible.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
          >
            <CategoryCard category={cat} priority={i < 3} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
