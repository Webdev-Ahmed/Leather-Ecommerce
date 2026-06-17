"use client";

import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types/api";

type VariantSelectorProps = {
  variants: ProductVariant[];
  selected: ProductVariant | null;
  onSelect: (variant: ProductVariant) => void;
};

export function VariantSelector({
  variants,
  selected,
  onSelect,
}: VariantSelectorProps) {
  if (variants.length === 0) return null;

  const getColorKey = (variant: ProductVariant) => variant.color ?? "default";

  // Group variants by color — each color gets one swatch
  const byColor = variants.reduce<Record<string, ProductVariant[]>>(
    (acc, v) => {
      const key = getColorKey(v);
      if (!acc[key]) acc[key] = [];
      acc[key].push(v);
      return acc;
    },
    {},
  );

  const hasSizes = variants.some((v) => v.size);

  return (
    <div className="space-y-5">
      {/* Color swatches */}
      <div>
        <p className="text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)] mb-3">
          Color
          {selected && (
            <span className="ml-2 text-[var(--color-text-primary)] normal-case tracking-normal">
              — {selected.color}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(byColor).map(([color, colorVariants]) => {
            const first = colorVariants[0];
            if (!first) return null;

            const colorLabel = first.color ?? "Default";
            const isSelected = selected
              ? getColorKey(selected) === color
              : false;
            const isOutOfStock = colorVariants.every((v) => v.stock === 0);

            return (
              <button
                key={color}
                onClick={() => onSelect(first)}
                disabled={isOutOfStock}
                aria-label={`Color: ${colorLabel}${isOutOfStock ? " (out of stock)" : ""}`}
                aria-pressed={isSelected}
                title={colorLabel}
                className={cn(
                  "relative w-8 h-8 rounded-full border-2 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed",
                  isSelected
                    ? "border-[var(--color-primary)] ring-2 ring-offset-1 ring-[var(--color-primary)]"
                    : "border-transparent hover:border-[var(--color-border)]",
                )}
                style={{ backgroundColor: first.colorHex ?? "#d1d5db" }}
              >
                {isOutOfStock && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="block w-full h-px bg-white/70 rotate-45" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size buttons — only render if any variant has a size */}
      {hasSizes && selected && (
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)] mb-3">
            Size
          </p>
          <div className="flex flex-wrap gap-2">
            {byColor[getColorKey(selected)]?.map((v) => {
              if (!v.size) return null;
              const isActive = selected.id === v.id;
              const isOutOfStock = v.stock === 0;

              return (
                <button
                  key={v.id}
                  onClick={() => onSelect(v)}
                  disabled={isOutOfStock}
                  aria-pressed={isActive}
                  className={cn(
                    "h-9 min-w-[40px] px-3 text-[11px] tracking-[0.1em] font-[var(--font-inter)] border transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed",
                    isActive
                      ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                      : "bg-transparent border-[var(--color-border)] text-[var(--color-text-body)] hover:border-[var(--color-text-primary)]",
                  )}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
