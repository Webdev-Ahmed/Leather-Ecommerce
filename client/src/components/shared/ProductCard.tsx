"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowUpRight } from "lucide-react";
import { useCartActions } from "@/hooks/useCartActions";
import { PriceDisplay } from "./PriceDisplay";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/api";
import toast from "react-hot-toast";

type ProductCardProps = {
  product: Product;
  priority?: boolean;
};

const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8AKwAB/9k=";

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const router = useRouter();
  const { addToCart, openCart } = useCartActions();

  const isOutOfStock = product.stock === 0;
  const hasVariants = product.variants.length > 0;
  const primaryImage = product.images[0] ?? "/images/placeholder.jpg";
  const secondaryImage = product.images[1] ?? null;
  const isNew = product.tags.includes("new");

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();

    if (hasVariants) {
      router.push(`/products/${product.slug}`);
      return;
    }

    if (isOutOfStock) return;

    try {
      await addToCart(product, null, 1);
      openCart();
      toast.success(`${product.name} added to bag`);
    } catch {
      toast.error("Failed to add to bag.");
    }
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      {/* ── Image container ── */}
      <div className="relative overflow-hidden bg-[var(--color-accent-light)] aspect-[3/4]">
        {/* Primary image */}
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className={cn(
            "object-cover transition-opacity duration-500",
            secondaryImage ? "group-hover:opacity-0" : "group-hover:scale-[1.04] transition-transform",
          )}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          priority={priority}
        />

        {/* Secondary image — crossfades in on hover, gives a "second angle" feel */}
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-[1.02]"
            aria-hidden="true"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isNew && (
            <span className="bg-[var(--color-primary)] text-white text-[9px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold px-2.5 py-1">
              New
            </span>
          )}
          {product.discountPrice && (
            <span className="bg-[var(--color-accent)] text-white text-[9px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold px-2.5 py-1">
              {Math.round((1 - product.discountPrice / product.price) * 100)}% Off
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-white/90 text-[var(--color-text-muted)] text-[9px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold px-2.5 py-1 border border-[var(--color-border)]">
              Sold Out
            </span>
          )}
        </div>

        {/* Quick-add circular button — top right, fades in on hover (desktop) */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          aria-label={
            isOutOfStock
              ? "Out of stock"
              : hasVariants
                ? `Select options for ${product.name}`
                : `Add ${product.name} to bag`
          }
          className={cn(
            "absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
            "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0",
            "focus-visible:opacity-100 focus-visible:translate-y-0",
            isOutOfStock
              ? "bg-white/60 text-[var(--color-text-muted)] cursor-not-allowed"
              : "bg-white text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white shadow-md",
          )}
        >
          {hasVariants ? (
            <ArrowUpRight size={15} strokeWidth={2} />
          ) : (
            <Plus size={16} strokeWidth={2} />
          )}
        </button>

        {/* Bottom CTA strip — slides up on hover (acts as quick-add label) */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 py-2.5 text-center",
            "text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold",
            "translate-y-full group-hover:translate-y-0 transition-transform duration-300",
            isOutOfStock
              ? "bg-[var(--color-text-muted)]/90 text-white"
              : "bg-[var(--color-primary)]/95 text-white",
          )}
        >
          {isOutOfStock
            ? "Out of Stock"
            : hasVariants
              ? "View Options"
              : "Quick Add"}
        </div>
      </div>

      {/* ── Info ── */}
      <div className="pt-3.5">
        {/* Category */}
        <p className="text-[9px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-medium text-[var(--color-text-muted)] mb-1">
          {product.category.name}
        </p>

        {/* Name */}
        <h3 className="font-display text-[0.95rem] font-normal tracking-[0.04em] text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1 leading-snug">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mt-1.5">
          <PriceDisplay
            price={product.price}
            discountPrice={product.discountPrice}
            size="sm"
          />
        </div>
      </div>
    </Link>
  );
}
