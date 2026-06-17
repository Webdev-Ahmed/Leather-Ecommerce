"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, AlertCircle, MapPin } from "lucide-react";
import { getOrderTracking } from "@/api/tracking";
import type { TrackingStep } from "@/api/tracking";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STEP_ICONS: Record<TrackingStep["status"], React.ElementType> = {
  pending:    Clock,
  processing: Package,
  shipped:    Truck,
  delivered:  CheckCircle2,
};

function StepRow({ step, isLast }: { step: TrackingStep; isLast: boolean }) {
  const Icon = STEP_ICONS[step.status];

  return (
    <div className="flex gap-4">
      {/* Icon column */}
      <div className="flex flex-col items-center shrink-0">
        <div className={cn(
          "w-10 h-10 flex items-center justify-center border-2 transition-colors shrink-0",
          step.isCompleted
            ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
            : "bg-white border-[var(--color-border)]",
        )}>
          <Icon
            size={16}
            strokeWidth={step.isCompleted ? 2 : 1.5}
            className={step.isCompleted ? "text-white" : "text-[var(--color-text-muted)]"}
          />
        </div>
        {!isLast && (
          <div className={cn(
            "w-0.5 flex-1 mt-1 min-h-[32px] transition-colors",
            step.isCompleted ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]",
          )} />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 pb-8", isLast && "pb-0")}>
        <div className="flex items-center justify-between gap-4 min-h-[40px]">
          <div>
            <p className={cn(
              "text-[13px] font-[var(--font-inter)] font-semibold leading-tight",
              step.isCompleted
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)]",
            )}>
              {step.label}
              {step.isCurrent && (
                <span className="ml-2 text-[9px] tracking-[0.2em] uppercase font-bold text-[var(--color-accent)] bg-[var(--color-accent-light)] px-2 py-0.5">
                  Current
                </span>
              )}
            </p>
            {step.completedAt && (
              <p className="text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)] mt-0.5">
                {formatDate(step.completedAt)}
              </p>
            )}
          </div>
        </div>
        {step.note && (
          <p className="mt-1.5 text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)] leading-relaxed bg-[var(--color-surface)] px-3 py-2 border-l-2 border-[var(--color-border)]">
            {step.note}
          </p>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-xl space-y-5 animate-pulse">
      <div className="h-4 w-28 bg-[var(--color-border)]" />
      <div className="h-8 w-56 bg-[var(--color-border)]" />
      <div className="bg-white border border-[var(--color-border)] p-6 space-y-8">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 bg-[var(--color-border)] shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 w-32 bg-[var(--color-border)]" />
              <div className="h-3 w-24 bg-[var(--color-border)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrackingDetailPage() {
  const params = useParams();
  const orderId = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");

  const { data: tracking, isLoading, isError } = useQuery({
    queryKey: ["tracking", orderId],
    queryFn: () => getOrderTracking(orderId),
    enabled: !!orderId,
    refetchInterval: 30_000, // poll every 30s for live updates
  });

  if (isLoading) return (
    <div className="py-6"><Skeleton /></div>
  );

  if (isError || !tracking) return (
    <div className="max-w-xl">
      <div className="bg-white border border-[var(--color-border)] p-8 text-center">
        <AlertCircle size={28} strokeWidth={1.25} className="text-[var(--color-text-muted)] mx-auto mb-4" />
        <p className="font-display text-xl font-light text-[var(--color-primary)] mb-2">Unable to load tracking</p>
        <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)] mb-6">
          Check your connection and try again.
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 h-10 px-6 bg-[var(--color-primary)] text-white text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors"
        >
          Back to Orders
        </Link>
      </div>
    </div>
  );

  const shortId = `#${tracking.orderId.slice(0, 8).toUpperCase()}`;

  return (
    <div className="max-w-xl space-y-6">
      {/* Back */}
      <Link
        href={`/account/orders/${tracking.orderId}`}
        className="inline-flex items-center gap-2 text-[11px] font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] tracking-[0.1em] uppercase hover:text-[var(--color-primary)] transition-colors"
      >
        <ArrowLeft size={13} strokeWidth={2} /> Back to Order
      </Link>

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-light text-[var(--color-primary)]">
          Track Order
        </h1>
        <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)] mt-1">
          {shortId}
        </p>
      </div>

      {/* Cancelled banner */}
      {tracking.isCancelled && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200">
          <XCircle size={16} strokeWidth={1.5} className="text-[var(--color-danger)] shrink-0" />
          <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-danger)]">
            This order was cancelled.
          </p>
        </div>
      )}

      {/* Tracking number */}
      {tracking.trackingNumber && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-accent-light)] border border-[var(--color-accent)]/30">
          <MapPin size={14} strokeWidth={1.5} className="text-[var(--color-accent)] shrink-0" />
          <div>
            <p className="text-[9px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-bold text-[var(--color-text-muted)] mb-0.5">
              Tracking Number
            </p>
            <p className="text-[13px] font-[var(--font-inter)] font-semibold text-[var(--color-primary)] tracking-wide">
              {tracking.trackingNumber}
            </p>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="bg-white border border-[var(--color-border)]">
        <div className="px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)]">
            Order Progress
          </p>
        </div>
        <div className="px-6 py-6">
          {tracking.steps.map((step, i) => (
            <StepRow
              key={step.status}
              step={step}
              isLast={i === tracking.steps.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Event log */}
      {tracking.events.length > 0 && (
        <div className="bg-white border border-[var(--color-border)]">
          <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <p className="text-[10px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)]">
              Activity Log
            </p>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {tracking.events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 px-6 py-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shrink-0 mt-2" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-[11px] tracking-[0.1em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-body)] capitalize">
                      {event.status}
                    </p>
                    <span className="text-[10px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
                      {formatDate(event.createdAt)}
                    </span>
                  </div>
                  {event.note && (
                    <p className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                      {event.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
