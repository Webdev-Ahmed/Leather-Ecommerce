"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

export function CartEmpty() {
  const closeCart = useCartStore((s) => s.closeCart);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-[var(--color-surface)] flex items-center justify-center mb-6">
        <ShoppingBag
          size={34}
          strokeWidth={0.75}
          className="text-[var(--color-border)]"
        />
      </div>

      <p className="text-[13px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-primary)] mb-2">
        Your bag is empty
      </p>
      <p className="text-[13px] font-[var(--font-inter)] font-light text-[var(--color-text-muted)] mb-8 leading-relaxed">
        Discover our premium leather collection
      </p>

      <Link
        href="/products"
        onClick={closeCart}
        className="inline-flex items-center gap-2 h-12 px-8 bg-[var(--color-primary)] text-white text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors group"
      >
        Shop Now
        <ArrowRight size={13} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
