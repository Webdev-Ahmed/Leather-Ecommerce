"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type FilterValue = "ALL" | "men" | "women" | "unisex";

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "ALL" },
  { label: "Men", value: "men" },
  { label: "Women", value: "women" },
  { label: "Unisex", value: "unisex" },
];

export function GenderFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = (searchParams.get("gender") as FilterValue | null) ?? "ALL";

  function handleSelect(value: FilterValue) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("gender");
    } else {
      params.set("gender", value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div
      role="group"
      aria-label="Filter by gender"
      className="flex items-center gap-2 flex-wrap"
    >
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => handleSelect(f.value)}
          className={cn(
            "h-8 px-5 text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-medium border transition-colors duration-150",
            active === f.value
              ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
              : "bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-primary)] hover:text-[var(--color-text-primary)]",
          )}
          aria-pressed={active === f.value}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
