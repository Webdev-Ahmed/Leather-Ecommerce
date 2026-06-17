"use client";

import { GenderFilter } from "./GenderFilter";
import type { Category } from "@/types/api";

type CategoryFiltersBarProps = {
  categories: Category[];
};

export function CategoryFiltersBar({ categories }: CategoryFiltersBarProps) {
  const count = categories.length;

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)]">
      <GenderFilter />
      <p className="text-[11px] tracking-[0.15em] font-[var(--font-inter)] text-[var(--color-text-muted)]">
        {count} {count === 1 ? "category" : "categories"}
      </p>
    </div>
  );
}
