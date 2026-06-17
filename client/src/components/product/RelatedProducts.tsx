"use client";

import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/shared/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

type RelatedProductsProps = {
  categorySlug: string;
  currentProductId: string;
};

export function RelatedProducts({
  categorySlug,
  currentProductId,
}: RelatedProductsProps) {
  const { data, isLoading } = useProducts({
    category: categorySlug,
    limit: 5,
  });

  // Exclude the current product, show up to 4
  const related = (data?.data ?? [])
    .filter((p) => p.id !== currentProductId)
    .slice(0, 4);

  if (!isLoading && related.length === 0) return null;

  return (
    <section className="border-t border-[var(--color-border)] pt-16 pb-12">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.35em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)] mb-2">
            You may also like
          </p>
          <h2 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-light tracking-[0.15em] uppercase text-[var(--color-text-primary)]">
            Related Products
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-[3/4] w-full" />
                  <Skeleton className="h-3 w-3/4 mt-3" />
                  <Skeleton className="h-3 w-1/2 mt-2" />
                </div>
              ))
            : related.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={i < 2}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
