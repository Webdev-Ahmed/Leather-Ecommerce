import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories } from "@/api/categories";
import { CategoryPageHeader } from "@/components/category/CategoryPageHeader";
import { CategoryFiltersBar } from "@/components/category/CategoryFiltersBar";
import { CategoryListingGrid } from "@/components/category/CategoryListingGrid";
import { CategoryGridSkeleton } from "@/components/category/CategoryGridSkeleton";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "All Categories",
  description:
    "Browse our full range of premium leather categories — wallets, bags, accessories, and more.",
};

export const revalidate = 3600;

export default async function CategoriesPage() {
  let categories;

  try {
    categories = await getCategories();
  } catch {
    notFound();
  }

  return (
    <>
      <CategoryPageHeader
        title="All Categories"
        description="Explore our curated range of premium leather goods, crafted with enduring quality."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Categories" }]}
        productCount={categories.length}
      />

      <Suspense
        fallback={
          <div className="h-[73px] border-b border-[var(--color-border)]" />
        }
      >
        <CategoryFiltersBar categories={categories} />
      </Suspense>

      <div className="max-w-[1400px] mx-auto">
        <Suspense
          fallback={<CategoryGridSkeleton count={categories.length || 6} />}
        >
          <CategoryListingGrid categories={categories} />
        </Suspense>
      </div>
    </>
  );
}
