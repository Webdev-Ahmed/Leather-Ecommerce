"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Package, ShoppingBag, ChevronRight, Calendar, ArrowRight } from "lucide-react";
import { getOrders } from "@/api/orders";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/api";

const STATUS: Record<
  OrderStatus,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  processing: {
    label: "Processing",
    dot: "bg-blue-400",
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  shipped: {
    label: "Shipped",
    dot: "bg-purple-400",
    text: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  delivered: {
    label: "Delivered",
    dot: "bg-green-500",
    text: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-red-400",
    text: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status] ?? {
    label: status,
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-[0.1em] uppercase font-[var(--font-inter)] font-semibold border",
        s.bg,
        s.text,
        s.border,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
      {s.label}
    </span>
  );
}

function OrderCard({ order }: { order: Order }) {
  const id = `#${order.id.slice(0, 8).toUpperCase()}`;
  const count = order.items?.length ?? 0;
  const first = order.items?.[0];
  const name = first?.name ?? "Order items";

  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="group flex items-stretch bg-white border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-sm transition-all duration-200 overflow-hidden"
    >
      {/* Left accent bar — coloured by status */}
      <div
        className={cn(
          "w-1 shrink-0 transition-colors duration-200",
          STATUS[order.status]?.dot ?? "bg-gray-300",
        )}
      />

      {/* Icon col */}
      <div className="w-14 flex items-center justify-center shrink-0 bg-[var(--color-surface)]">
        <Package
          size={18}
          strokeWidth={1.25}
          className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-4 pr-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-[var(--font-inter)] font-bold text-[var(--color-primary)] tracking-wide">
              {id}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Calendar size={10} strokeWidth={1.5} className="text-[var(--color-text-muted)] shrink-0" />
              <p className="text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
                {formatDate(order.createdAt)} · {count}{" "}
                {count === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <ChevronRight
            size={15}
            strokeWidth={1.5}
            className="text-[var(--color-border)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
          />
        </div>

        <p className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-body)] mt-2 line-clamp-1">
          {name}
          {count > 1 ? ` + ${count - 1} more` : ""}
        </p>

        <div className="flex items-center justify-between mt-3">
          <StatusBadge status={order.status} />
          <span className="font-price text-[14px] font-bold text-[var(--color-text-primary)]">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function Skeleton() {
  return (
    <div className="bg-white border border-[var(--color-border)] flex items-stretch animate-pulse overflow-hidden">
      <div className="w-1 bg-[var(--color-border)] shrink-0" />
      <div className="w-14 bg-[var(--color-surface)] shrink-0" />
      <div className="flex-1 py-4 pr-4 space-y-2.5">
        <div className="h-4 w-28 bg-[var(--color-border)]" />
        <div className="h-3 w-44 bg-[var(--color-border)]" />
        <div className="h-3 w-36 bg-[var(--color-border)]" />
        <div className="flex justify-between pt-1">
          <div className="h-5 w-20 bg-[var(--color-border)]" />
          <div className="h-4 w-16 bg-[var(--color-border)]" />
        </div>
      </div>
    </div>
  );
}

const LIMIT = 10;

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [all, setAll] = useState<Order[]>([]);
  const seen = useRef(new Set<number>());

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["orders", page],
    queryFn: () => getOrders(page, LIMIT),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!data || seen.current.has(page)) return;
    seen.current.add(page);
    setAll((prev) => {
      const ids = new Set(prev.map((o) => o.id));
      return [...prev, ...data.data.filter((o) => !ids.has(o.id))];
    });
  }, [data, page]);

  const total = data?.pagination?.total ?? data?.meta?.total ?? all.length;
  const totalPages =
    data?.pagination?.totalPages ?? data?.meta?.totalPages ?? 1;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-display text-3xl font-light text-[var(--color-primary)]">
          Order History
        </h1>
        {!isLoading && all.length > 0 && (
          <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)] mt-1">
            {total} {total === 1 ? "order" : "orders"} placed
          </p>
        )}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && all.length === 0 && (
        <div className="bg-white border border-[var(--color-border)] py-16 text-center px-8">
          <div className="w-16 h-16 bg-[var(--color-surface)] flex items-center justify-center mx-auto mb-5">
            <ShoppingBag
              size={28}
              strokeWidth={1}
              className="text-[var(--color-border)]"
            />
          </div>
          <p className="font-display text-xl font-light text-[var(--color-primary)] mb-2">
            No orders yet
          </p>
          <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)] mb-7 max-w-xs mx-auto">
            When you place your first order, it will appear here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 h-11 px-7 bg-[var(--color-primary)] text-white text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors"
          >
            Start Shopping
            <ArrowRight size={13} strokeWidth={2} />
          </Link>
        </div>
      )}

      {/* Cards */}
      {all.length > 0 && (
        <div className="space-y-2.5">
          {all.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}

      {/* Load more */}
      {page < totalPages && !isLoading && (
        <div className="pt-6 text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching}
            className="h-11 px-8 bg-[var(--color-primary)] text-white text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold disabled:opacity-50 hover:bg-[var(--color-accent)] transition-colors"
          >
            {isFetching ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading…
              </span>
            ) : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
