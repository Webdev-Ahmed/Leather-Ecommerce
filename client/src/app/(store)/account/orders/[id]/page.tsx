"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { getOrder, cancelOrder } from "@/api/orders";
import {
  initiatePayFast,
  initiateJazzCash,
  initiateEasypaisa,
  submitPaymentForm,
} from "@/api/payments";
import type { OrderItem, OrderEvent } from "@/types/api";
import { formatPrice, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Hash,
  Package,
  Truck,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

function OrderDetailSkeleton() {
  return (
    <div className="max-w-2xl space-y-6 animate-pulse">
      <Skeleton className="h-4 w-28" />
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="bg-white border border-[var(--color-border)] p-5 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-14 h-16 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  const lineTotal = item.price * item.quantity;
  const hasMeta = item.color ?? item.size;

  return (
    <div className="flex items-start gap-4 py-4 border-b border-[var(--color-border)] last:border-0">
      <div className="relative shrink-0 w-14 h-16 bg-[var(--color-accent-light)] overflow-hidden">
        <Image
          src={item.image || "/images/placeholder.jpg"}
          alt={item.name}
          fill
          sizes="56px"
          className="object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "/images/placeholder.jpg";
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-body)] font-semibold line-clamp-2 leading-snug">
          {item.name}
        </p>
        {hasMeta && (
          <p className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-inter)] mt-0.5">
            {[item.color, item.size].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-inter)] mt-0.5">
          {item.quantity} × {formatPrice(item.price)}
        </p>
      </div>
      <p className="shrink-0 text-[13px] font-[var(--font-inter)] text-[var(--color-text-primary)] font-bold font-price tabular-nums">
        {formatPrice(lineTotal)}
      </p>
    </div>
  );
}

function EventRow({ event, isLast }: { event: OrderEvent; isLast: boolean }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-accent-light)] mt-0.5 shrink-0" />
        {!isLast && (
          <div className="w-px flex-1 bg-[var(--color-border)] mt-1.5 min-h-[20px]" />
        )}
      </div>
      <div className={cn("flex-1 min-w-0", !isLast && "pb-5")}>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={event.status} />
          <span className="text-[10px] tracking-[0.1em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)]">
            {formatDate(event.createdAt)}
          </span>
        </div>
        {event.note && (
          <p className="mt-1.5 text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)] leading-relaxed">
            {event.note}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[var(--color-border)]">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <Icon
          size={13}
          strokeWidth={1.5}
          className="text-[var(--color-text-muted)]"
        />
        <p className="text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)]">
          {title}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      toast.success("Order cancelled");
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message ?? "Failed to cancel order");
    },
  });

  function handleCancel() {
    if (window.confirm("Cancel this order?")) {
      cancelMutation.mutate();
    }
  }

  if (isLoading || !order) return <OrderDetailSkeleton />;

  const sortedEvents = [...order.events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const paymentMethodLabel: Record<string, string> = {
    cod: "Cash on Delivery",
    payfast: "PayFast",
    jazzcash: "JazzCash",
    easypaisa: "Easypaisa",
  };

  async function handleRetryPayment() {
    if (!order) return;
    setRetrying(true);
    try {
      if (order.paymentMethod === "payfast") {
        const { payfastUrl, formData } = await initiatePayFast(order.id);
        submitPaymentForm(payfastUrl, formData);
      } else if (order.paymentMethod === "jazzcash") {
        const { jazzcashUrl, formData } = await initiateJazzCash(order.id);
        submitPaymentForm(jazzcashUrl, formData);
      } else if (order.paymentMethod === "easypaisa") {
        const { easypaisaUrl, formData } = await initiateEasypaisa(order.id);
        submitPaymentForm(easypaisaUrl, formData);
      }
    } catch (err) {
      const appErr = err as { message?: string };
      toast.error(
        appErr.message ?? "Failed to initiate payment. Please try again.",
      );
    } finally {
      setRetrying(false);
    }
  }

  const canRetryPayment =
    order.paymentMethod !== "cod" &&
    order.paymentStatus === "unpaid" &&
    ["pending", "processing"].includes(order.status);

  return (
    <div className="max-w-2xl space-y-5">
      {/* Back */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-[11px] font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] tracking-[0.1em] uppercase hover:text-[var(--color-primary)] transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={2} /> Back to Orders
        </Link>
        {["pending", "processing", "shipped"].includes(order.status) && (
          <Link
            href={`/account/tracking/${order.id}`}
            className="inline-flex items-center gap-2 text-[11px] font-[var(--font-inter)] font-semibold text-[var(--color-accent)] tracking-[0.1em] uppercase hover:opacity-70 transition-opacity"
          >
            <Truck size={13} strokeWidth={2} /> Track Order
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="bg-white border border-[var(--color-border)] overflow-hidden">
        <div className="bg-[var(--color-primary)] px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Hash size={13} strokeWidth={2} className="text-white/50" />
              <h1 className="font-display text-2xl font-light tracking-wide text-white">
                {order.id.slice(0, 8).toUpperCase()}
              </h1>
            </div>
            <p className="text-[11px] font-[var(--font-inter)] text-white/45">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={order.status} />
            {order.status === "pending" && (
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="h-8 px-4 border border-red-400/60 text-red-300 text-[10px] font-[var(--font-inter)] font-semibold tracking-[0.15em] uppercase hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                {cancelMutation.isPending ? "Cancelling…" : "Cancel Order"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <InfoSection icon={Package} title="Items Ordered">
        {order.items.map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}
        {/* Total row */}
        <div className="flex justify-between items-center pt-4 mt-1 border-t border-[var(--color-border)]">
          <span className="text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)]">
            Order Total
          </span>
          <span className="text-lg font-bold font-price tabular-nums text-[var(--color-primary)]">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </InfoSection>

      {/* Payment info */}
      <InfoSection icon={CreditCard} title="Payment">
        <div className="space-y-2.5">
          {[
            [
              "Method",
              paymentMethodLabel[order.paymentMethod] ?? order.paymentMethod,
            ],
            [
              "Status",
              <span key="ps" className="capitalize">
                {order.paymentStatus}
              </span>,
            ],
            ...(order.trackingNumber
              ? [["Tracking #", order.trackingNumber]]
              : []),
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="flex justify-between text-[13px] font-[var(--font-inter)]"
            >
              <span className="text-[var(--color-text-muted)]">{label}</span>
              <span className="text-[var(--color-text-body)] font-medium">
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Retry payment — shown when online payment failed */}
        {canRetryPayment && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <p className="text-[12px] font-[var(--font-inter)] text-[var(--color-danger)] mb-3">
              Payment was not completed. You can retry using the same method.
            </p>
            <button
              onClick={handleRetryPayment}
              disabled={retrying}
              className="inline-flex items-center gap-2 h-9 px-5 bg-[var(--color-primary)] text-white text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={12}
                strokeWidth={2}
                className={retrying ? "animate-spin" : ""}
              />
              {retrying
                ? "Redirecting…"
                : `Retry with ${paymentMethodLabel[order.paymentMethod]}`}
            </button>
          </div>
        )}
      </InfoSection>

      {/* Shipping address */}
      <InfoSection icon={MapPin} title="Shipping Address">
        {order.shippingAddress.label && (
          <p className="text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] mb-2">
            {order.shippingAddress.label}
          </p>
        )}
        <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-body)] leading-relaxed">
          {order.shippingAddress.street}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
          {order.shippingAddress.postalCode}
          <br />
          {order.shippingAddress.country}
        </p>
      </InfoSection>

      {/* Events timeline */}
      {sortedEvents.length > 0 && (
        <InfoSection icon={Package} title="Order Timeline">
          {sortedEvents.map((event, i) => (
            <EventRow
              key={event.id}
              event={event}
              isLast={i === sortedEvents.length - 1}
            />
          ))}
        </InfoSection>
      )}
    </div>
  );
}
