import { formatPrice } from "@/lib/utils";
import { Truck, CheckCircle } from "lucide-react";

type FreeDeliveryBarProps = {
  amountToFreeDelivery: number;
  subtotal: number;
};

const FREE_DELIVERY_THRESHOLD = 1990;

export function FreeDeliveryBar({
  amountToFreeDelivery,
  subtotal,
}: FreeDeliveryBarProps) {
  const qualified = amountToFreeDelivery === 0;
  const progress = Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100);

  return (
    <div className="px-6 py-3.5 bg-[var(--color-surface)] border-b border-[var(--color-border)] shrink-0">
      <div className="flex items-center gap-2 mb-2">
        {qualified ? (
          <CheckCircle size={12} strokeWidth={2} className="text-[var(--color-success)] shrink-0" />
        ) : (
          <Truck size={12} strokeWidth={1.5} className="text-[var(--color-text-muted)] shrink-0" />
        )}
        <p className="text-[11px] font-[var(--font-inter)] text-[var(--color-text-body)]">
          {qualified ? (
            <span className="text-[var(--color-success)] font-semibold">
              Free delivery unlocked!
            </span>
          ) : (
            <>
              Spend{" "}
              <span className="font-bold text-[var(--color-primary)]">
                {formatPrice(amountToFreeDelivery)}
              </span>{" "}
              more for free delivery
            </>
          )}
        </p>
      </div>
      {/* Progress bar */}
      <div className="h-1 w-full bg-[var(--color-border)] overflow-hidden rounded-full">
        <div
          className="h-full bg-[var(--color-accent)] transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
