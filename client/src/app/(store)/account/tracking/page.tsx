"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Truck, Package, ArrowRight, Clock } from "lucide-react";
import { getOrders } from "@/api/orders";
import { formatDate, formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";

const TRACKABLE_STATUSES = ["pending", "processing", "shipped"];

export default function TrackingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["orders", 1],
    queryFn: () => getOrders(1, 20),
  });

  const trackableOrders = data?.data.filter((o) =>
    TRACKABLE_STATUSES.includes(o.status),
  ) ?? [];

  return (
    <div className="max-w-2xl">
      <div className="mb-7">
        <h1 className="font-display text-3xl font-light text-[var(--color-primary)]">
          Track Orders
        </h1>
        <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)] mt-1">
          Live status for your active orders.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-2.5 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-white border border-[var(--color-border)]" />
          ))}
        </div>
      )}

      {!isLoading && trackableOrders.length === 0 && (
        <div className="bg-white border border-[var(--color-border)] py-16 text-center px-8">
          <div className="w-14 h-14 bg-[var(--color-surface)] flex items-center justify-center mx-auto mb-4">
            <Truck size={22} strokeWidth={1} className="text-[var(--color-border)]" />
          </div>
          <p className="font-display text-xl font-light text-[var(--color-primary)] mb-2">
            No active orders
          </p>
          <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)] mb-6">
            Delivered and cancelled orders are not shown here.
          </p>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 h-10 px-6 bg-[var(--color-primary)] text-white text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors"
          >
            <Package size={12} strokeWidth={1.5} /> View All Orders
          </Link>
        </div>
      )}

      {!isLoading && trackableOrders.length > 0 && (
        <div className="space-y-2.5">
          {trackableOrders.map((order) => (
            <Link
              key={order.id}
              href={`/account/tracking/${order.id}`}
              className="group flex items-center gap-4 bg-white border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-sm transition-all p-5"
            >
              <div className="w-9 h-9 bg-[var(--color-surface)] flex items-center justify-center shrink-0">
                <Truck size={15} strokeWidth={1.5} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[13px] font-[var(--font-inter)] font-bold text-[var(--color-primary)] tracking-wide">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
                  <Clock size={10} strokeWidth={1.5} />
                  {formatDate(order.createdAt)} · {formatPrice(order.totalAmount)}
                </div>
              </div>
              <ArrowRight
                size={15}
                strokeWidth={1.5}
                className="text-[var(--color-border)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
