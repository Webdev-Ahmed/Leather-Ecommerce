"use client";

import { useState } from "react";
import { ShoppingBag, Truck, RotateCcw, Shield, ChevronRight } from "lucide-react";
import { useCartActions } from "@/hooks/useCartActions";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { VariantSelector } from "./VariantSelector";
import { QuantitySelector } from "./QuantitySelector";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Product, ProductVariant } from "@/types/api";
import Link from "next/link";

type PDPInfoProps = {
  product: Product;
};

const GUARANTEES = [
  { icon: Truck, text: "Free delivery on orders over RS. 1,990" },
  { icon: RotateCcw, text: "Easy returns within 7 days" },
  { icon: Shield, text: "100% genuine leather guaranteed" },
] as const;

export function PDPInfo({ product }: PDPInfoProps) {
  const { addToCart, openCart } = useCartActions();

  const hasVariants = product.variants.length > 0;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants ? (product.variants[0] ?? null) : null,
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const effectiveStock = selectedVariant?.stock ?? product.stock;
  const effectivePrice =
    selectedVariant?.priceOverride ?? product.discountPrice ?? product.price;
  const isOutOfStock = effectiveStock === 0;
  const variantRequired = hasVariants && !selectedVariant;

  async function handleAddToCart() {
    if (isOutOfStock || variantRequired) return;
    setIsAdding(true);
    try {
      await addToCart(product, selectedVariant, quantity);
      openCart();
      toast.success(`${product.name} added to bag`);
      setQuantity(1);
    } catch {
      toast.error("Failed to add to bag. Please try again.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)]">
        <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">
          Home
        </Link>
        <ChevronRight size={10} strokeWidth={1.5} className="shrink-0 opacity-40" />
        <Link
          href={`/categories/${product.category.slug}`}
          className="hover:text-[var(--color-accent)] transition-colors"
        >
          {product.category.name}
        </Link>
        <ChevronRight size={10} strokeWidth={1.5} className="shrink-0 opacity-40" />
        <span className="text-[var(--color-text-primary)] line-clamp-1">{product.name}</span>
      </nav>

      {/* Category label */}
      <div>
        <span className="text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-accent)]">
          {product.category.name}
        </span>
      </div>

      {/* Name */}
      <h1 className="font-display text-[clamp(1.85rem,3vw,2.75rem)] font-light tracking-[0.08em] text-[var(--color-text-primary)] leading-[1.1] -mt-3">
        {product.name}
      </h1>

      {/* Price */}
      <div className="flex items-center gap-3">
        <PriceDisplay
          price={selectedVariant?.priceOverride ?? product.price}
          discountPrice={
            selectedVariant?.priceOverride ? null : product.discountPrice
          }
          size="lg"
        />
        {selectedVariant?.priceOverride &&
          selectedVariant.priceOverride !== product.price && (
            <span className="text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
              (variant price)
            </span>
          )}
      </div>

      {/* Stock indicator */}
      <div className="-mt-2">
        {isOutOfStock ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-danger)]">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Out of Stock
          </span>
        ) : effectiveStock <= 5 ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Only {effectiveStock} left
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-success)]">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            In Stock
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--color-border)]" />

      {/* Variants */}
      {hasVariants && (
        <VariantSelector
          variants={product.variants}
          selected={selectedVariant}
          onSelect={setSelectedVariant}
        />
      )}

      {/* Quantity + Add to cart */}
      <div className="flex flex-col sm:flex-row gap-3">
        <QuantitySelector
          value={quantity}
          max={Math.min(effectiveStock, 20)}
          onChange={setQuantity}
        />
        <div className="flex-1 flex flex-col gap-1.5">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || variantRequired || isAdding}
            className={cn(
              "h-12 w-full flex items-center justify-center gap-2.5",
              "text-[11px] tracking-[0.3em] uppercase font-[var(--font-inter)] font-semibold",
              "border transition-all duration-200",
              isOutOfStock || variantRequired || isAdding
                ? "bg-[var(--color-border)] border-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
                : "bg-[var(--color-primary)] border-[var(--color-primary)] text-white hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)]",
            )}
          >
            {isAdding ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding…
              </>
            ) : (
              <>
                <ShoppingBag size={15} strokeWidth={1.5} />
                {isOutOfStock ? "Out of Stock" : "Add to Bag"}
              </>
            )}
          </button>
          {variantRequired && (
            <p className="text-[10px] font-[var(--font-inter)] text-[var(--color-danger)] tracking-wide">
              Please select a colour / size before adding to bag
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--color-border)]" />

      {/* Description */}
      <div>
        <p className="text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] mb-3">
          Description
        </p>
        <p className="text-[13px] font-[var(--font-inter)] font-light text-[var(--color-text-body)] leading-[1.75]">
          {product.description}
        </p>
      </div>

      {/* Tags */}
      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] px-2.5 py-1 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors cursor-default"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Guarantees */}
      <div className="space-y-0 border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {GUARANTEES.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3.5 px-4 py-3">
            <Icon
              size={14}
              strokeWidth={1.5}
              className="text-[var(--color-accent)] shrink-0"
            />
            <p className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
