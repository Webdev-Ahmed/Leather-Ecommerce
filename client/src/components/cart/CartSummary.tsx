import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type CartSummaryProps = {
  subtotal: number;
  deliveryFee: number;
  total: number;
  onCheckout: () => void;
};

export function CartSummary({
  subtotal,
  deliveryFee,
  total,
  onCheckout,
}: CartSummaryProps) {
  return (
    <div className="border-t border-[var(--color-border)] px-6 py-5 bg-white shrink-0">
      {/* Lines */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
            Subtotal
          </span>
          <span className="font-price text-[13px] font-medium text-[var(--color-text-primary)]">
            {formatPrice(subtotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
            Delivery
          </span>
          <span className="font-price text-[13px] font-medium">
            {deliveryFee === 0 ? (
              <span className="text-[var(--color-success)]">Free</span>
            ) : (
              formatPrice(deliveryFee)
            )}
          </span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center py-3 border-t border-[var(--color-border)] mb-4">
        <span className="text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-bold text-[var(--color-text-primary)]">
          Total
        </span>
        <span className="font-price text-xl font-bold text-[var(--color-primary)]">
          {formatPrice(total)}
        </span>
      </div>

      {/* Checkout CTA */}
      <button
        onClick={onCheckout}
        className="w-full h-12 bg-[var(--color-primary)] text-white text-[11px] tracking-[0.3em] uppercase font-[var(--font-inter)] font-bold hover:bg-[var(--color-accent)] transition-colors duration-200 mb-3 flex items-center justify-center gap-2 group"
      >
        Checkout
        <ArrowRight size={13} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Continue shopping */}
      <Link
        href="/products"
        className="block w-full h-10 border border-[var(--color-border)] text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
