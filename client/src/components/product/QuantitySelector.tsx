"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantitySelectorProps = {
  value: number;
  max: number;
  onChange: (value: number) => void;
};

export function QuantitySelector({
  value,
  max,
  onChange,
}: QuantitySelectorProps) {
  const canDecrement = value > 1;
  const canIncrement = value < max;

  return (
    <div className="flex items-center border border-[var(--color-border)] w-fit">
      <button
        onClick={() => canDecrement && onChange(value - 1)}
        disabled={!canDecrement}
        aria-label="Decrease quantity"
        className={cn(
          "w-10 h-10 flex items-center justify-center text-[var(--color-text-body)] transition-colors",
          canDecrement
            ? "hover:bg-[var(--color-accent-light)] hover:text-[var(--color-primary)]"
            : "opacity-30 cursor-not-allowed",
        )}
      >
        <Minus size={14} />
      </button>

      <span className="w-10 h-10 flex items-center justify-center text-[13px] font-[var(--font-inter)] font-medium text-[var(--color-text-primary)] border-x border-[var(--color-border)] select-none">
        {value}
      </span>

      <button
        onClick={() => canIncrement && onChange(value + 1)}
        disabled={!canIncrement}
        aria-label="Increase quantity"
        className={cn(
          "w-10 h-10 flex items-center justify-center text-[var(--color-text-body)] transition-colors",
          canIncrement
            ? "hover:bg-[var(--color-accent-light)] hover:text-[var(--color-primary)]"
            : "opacity-30 cursor-not-allowed",
        )}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
