import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PriceDisplayProps = {
  price: number;
  discountPrice?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function PriceDisplay({
  price,
  discountPrice,
  className,
  size = "md",
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  if (discountPrice) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span
          className={cn("font-price text-(--color-accent)", sizeClasses[size])}
        >
          {formatPrice(discountPrice)}
        </span>
        <span
          className={cn(
            "font-price text-(--color-text-muted) line-through",
            size === "lg" ? "text-base" : "text-sm",
          )}
        >
          {formatPrice(price)}
        </span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "font-price text-(--color-text-primary)",
        sizeClasses[size],
        className,
      )}
    >
      {formatPrice(price)}
    </span>
  );
}
