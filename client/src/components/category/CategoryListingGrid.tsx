"use client";

import { motion } from "framer-motion";
import { CategoryCard } from "@/components/shared/CategoryCard";
import type { Category } from "@/types/api";

type CategoryListingGridProps = {
  categories: Category[];
};

export function CategoryListingGrid({ categories }: CategoryListingGridProps) {
  const filtered = categories;

  if (filtered.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-[11px] tracking-[0.25em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)]">
          No categories found
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((category, i) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: Math.min(i, 5) * 0.07 }}
        >
          <CategoryCard category={category} priority={i < 3} />
        </motion.div>
      ))}
    </div>
  );
}
