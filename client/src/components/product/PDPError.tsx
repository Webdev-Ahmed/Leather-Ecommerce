"use client";

import Link from "next/link";
import { RefreshCw, ArrowLeft, AlertTriangle } from "lucide-react";

type PDPErrorProps = {
  onRetry: () => void;
};

/**
 * Shown when the product fetch fails for a reason OTHER than 404
 * (e.g. network error, 500, timeout). A real "not found" calls
 * Next's notFound() and renders the not-found.tsx boundary instead —
 * this component is specifically for "something went wrong, try again".
 */
export function PDPError({ onRetry }: PDPErrorProps) {
  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-24">
      <div className="max-w-md mx-auto text-center">
        <div className="w-14 h-14 mx-auto mb-6 bg-[var(--color-surface)] flex items-center justify-center">
          <AlertTriangle size={24} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
        </div>
        <h1 className="font-display text-2xl font-light text-[var(--color-text-primary)] mb-2">
          Something Went Wrong
        </h1>
        <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)] leading-relaxed mb-8">
          We couldn&apos;t load this product right now. This is usually temporary —
          check your connection and try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 h-11 px-6 bg-[var(--color-primary)] text-white text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors"
          >
            <RefreshCw size={13} strokeWidth={2} />
            Try Again
          </button>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 h-11 px-6 border border-[var(--color-border)] text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            <ArrowLeft size={13} strokeWidth={2} />
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
