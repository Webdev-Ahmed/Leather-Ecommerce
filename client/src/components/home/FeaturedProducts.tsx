"use client";

import { useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/shared/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/api";

type FeaturedProductsProps = {
  products: Product[];
  isLoading?: boolean;
};

const SKELETON_COUNT = 4;

export function FeaturedProducts({
  products,
  isLoading = false,
}: FeaturedProductsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  function scroll(direction: "left" | "right") {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 280;
    el.scrollBy({
      left: direction === "left" ? -(cardWidth + 24) : cardWidth + 24,
      behavior: "smooth",
    });
  }

  return (
    <section className="py-20 bg-[var(--color-surface-card)]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.35em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)] mb-3">
            Featured Collection
          </p>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] font-light tracking-[0.15em] uppercase text-[var(--color-text-primary)]">
            Top Sellers
          </h2>
        </div>

        {/* Carousel wrapper — overflow-hidden clips the -left/right arrows so they
            never push the scroll width beyond the viewport */}
        <div className="relative overflow-hidden">
          {/* Left arrow — inside the overflow-hidden parent, use px offset not negative */}
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll left"
            className={cn(
              "absolute left-0 top-[40%] -translate-y-1/2 z-10 w-9 h-9 bg-[var(--color-surface-card)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-sm",
              !canScrollLeft && "opacity-0 pointer-events-none",
            )}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Scrollable track */}
          <div
            ref={trackRef}
            onScroll={updateScrollState}
            className="flex gap-5 overflow-x-auto scrollbar-none pb-2"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {isLoading
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-none w-[calc(50%-10px)] sm:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)]"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <Skeleton className="aspect-[3/4] w-full" />
                    <Skeleton className="h-3 w-3/4 mt-3" />
                    <Skeleton className="h-3 w-1/2 mt-2" />
                  </div>
                ))
              : products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: Math.min(i, 3) * 0.06 }}
                    className="flex-none w-[calc(50%-10px)] sm:w-[calc(33.333%-14px)] lg:w-[calc(25%-15px)]"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <ProductCard product={product} priority={i < 4} />
                  </motion.div>
                ))}
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll right"
            className={cn(
              "absolute right-0 top-[40%] -translate-y-1/2 z-10 w-9 h-9 bg-[var(--color-surface-card)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-sm",
              !canScrollRight && "opacity-0 pointer-events-none",
            )}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-12">
          <a
            href="/products"
            className="inline-flex items-center border border-[var(--color-primary)] text-[var(--color-primary)] text-[11px] tracking-[0.25em] uppercase font-[var(--font-inter)] px-10 py-3.5 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors duration-200"
          >
            View All Products
          </a>
        </div>
      </div>
    </section>
  );
}
