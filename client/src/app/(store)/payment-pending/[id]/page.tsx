"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { getOrder } from "@/api/orders";
import { RequireAuth } from "@/components/auth/RequireAuth";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20; // 60 seconds total

function PaymentPendingContent() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");
  const [polls, setPolls] = useState(0);
  const [status, setStatus] = useState<"polling" | "paid" | "timeout">("polling");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { refetch } = useQuery({
    queryKey: ["order-poll", orderId],
    queryFn: () => getOrder(orderId),
    enabled: false,
  });

  useEffect(() => {
    if (!orderId) return;
    intervalRef.current = setInterval(async () => {
      setPolls((p) => {
        const next = p + 1;
        if (next >= MAX_POLLS) {
          setStatus("timeout");
          clearInterval(intervalRef.current!);
        }
        return next;
      });
      const result = await refetch();
      const o = result.data;
      if (o?.paymentStatus === "paid") {
        setStatus("paid");
        clearInterval(intervalRef.current!);
        setTimeout(() => router.push(`/order-confirmed/${orderId}`), 1500);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const shortId = orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : "";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-sm w-full text-center">
        {status === "polling" && (
          <>
            <Loader2 size={48} strokeWidth={1} className="text-[var(--color-accent)] mx-auto mb-6 animate-spin" />
            <h1 className="font-display text-2xl font-light text-[var(--color-primary)] mb-2">
              Confirming Payment
            </h1>
            <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)] mb-2">
              Waiting for Easypaisa to confirm your payment for order{" "}
              <span className="font-semibold">{shortId}</span>.
            </p>
            <p className="text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
              Please do not close this page.
            </p>
            <div className="flex justify-center gap-1.5 mt-6">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </>
        )}
        {status === "paid" && (
          <>
            <CheckCircle2 size={48} strokeWidth={1} className="text-[var(--color-success)] mx-auto mb-6" />
            <h1 className="font-display text-2xl font-light text-[var(--color-primary)] mb-2">Payment Confirmed!</h1>
            <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
              Redirecting to your order confirmation…
            </p>
          </>
        )}
        {status === "timeout" && (
          <>
            <Clock size={48} strokeWidth={1} className="text-[var(--color-text-muted)] mx-auto mb-6" />
            <h1 className="font-display text-2xl font-light text-[var(--color-primary)] mb-2">Still Processing</h1>
            <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)] mb-6 leading-relaxed">
              We haven&apos;t received confirmation yet. Your payment may still be processing.
              Check your order status — it will update automatically.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => router.push(`/account/orders/${orderId}`)}
                className="h-11 w-full bg-[var(--color-primary)] text-white text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors">
                View Order Status
              </button>
              <button onClick={() => router.push("/account/orders")}
                className="h-11 w-full border border-[var(--color-border)] text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                My Orders
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <RequireAuth>
      <PaymentPendingContent />
    </RequireAuth>
  );
}
