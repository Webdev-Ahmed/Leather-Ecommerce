"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus } from "lucide-react";
import { useCartActions } from "@/hooks/useCartActions";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/store/cart-store";

type CartLineItemProps = {
  item: CartItem;
};

export function CartLineItem({ item }: CartLineItemProps) {
  const { updateCart, removeFromCart } = useCartActions();
  const closeCart = useCartStore((s) => s.closeCart);

  const { cartItemId, product, variant, quantity } = item;
  const price =
    variant?.priceOverride ?? product.discountPrice ?? product.price;
  const lineTotal = price * quantity;
  const image =
    variant?.images[0] ?? product.images[0] ?? "/images/placeholder.jpg";
  const maxQty = Math.min(variant?.stock ?? product.stock, 20);

  return (
    <div className="flex gap-4 py-5 border-b border-[var(--color-border)] last:border-b-0">
      {/* Thumbnail */}
      <Link
        href={`/products/${product.slug}`}
        onClick={closeCart}
        className="relative shrink-0 w-[68px] h-[84px] bg-[var(--color-accent-light)] overflow-hidden hover:opacity-90 transition-opacity"
        tabIndex={-1}
      >
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="68px"
          className="object-cover"
        />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <Link
              href={`/products/${product.slug}`}
              onClick={closeCart}
              className="text-[11px] tracking-[0.12em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors line-clamp-2 leading-snug"
            >
              {product.name}
            </Link>
            {variant && (variant.color || variant.size) && (
              <span className="text-[10px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
                {[variant.color, variant.size].filter(Boolean).join(" / ")}
              </span>
            )}
          </div>
          <button
            onClick={() => void removeFromCart(cartItemId)}
            aria-label={`Remove ${product.name}`}
            className="shrink-0 w-5 h-5 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-red-50 transition-all rounded-sm mt-0.5"
          >
            <X size={13} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Qty controls */}
          <div className="flex items-center border border-[var(--color-border)] h-8">
            <button
              onClick={() => void updateCart(cartItemId, quantity - 1)}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="w-8 h-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Minus size={10} />
            </button>
            <span className="w-8 h-full flex items-center justify-center text-[12px] font-[var(--font-inter)] font-semibold text-[var(--color-text-primary)] border-x border-[var(--color-border)] select-none">
              {quantity}
            </span>
            <button
              onClick={() => void updateCart(cartItemId, quantity + 1)}
              disabled={quantity >= maxQty}
              aria-label="Increase quantity"
              className="w-8 h-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Plus size={10} />
            </button>
          </div>

          {/* Line total */}
          <span className="font-price text-[13px] font-bold text-[var(--color-text-primary)]">
            {formatPrice(lineTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
