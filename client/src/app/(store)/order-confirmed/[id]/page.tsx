"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingBag, MapPin, CreditCard } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { getOrder } from "@/api/orders";
import { formatPrice } from "@/lib/utils";

function OrderConfirmedSkeleton() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 animate-pulse">
      <div className="w-20 h-20 rounded-full bg-[var(--color-border)] mb-8" />
      <div className="h-9 w-60 bg-[var(--color-border)] mb-3" />
      <div className="h-4 w-44 bg-[var(--color-border)] mb-10" />
      <div className="w-full max-w-md space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-3">
            <div className="h-2.5 w-16 bg-[var(--color-border)]" />
            <div className="h-2.5 w-28 bg-[var(--color-border)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedCheckmark() {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true">
      {/* Outer ring */}
      <motion.circle
        cx="44"
        cy="44"
        r="40"
        stroke="var(--color-success)"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
      />
      {/* Fill circle */}
      <motion.circle
        cx="44"
        cy="44"
        r="36"
        fill="var(--color-success)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      />
      {/* Checkmark */}
      <motion.path
        d="M26 44L39 57L62 31"
        stroke="var(--color-success)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.55, ease: "easeInOut", delay: 0.4 }}
      />
    </svg>
  );
}

function OrderConfirmedContent({ id }: { id: string }) {
  // Note: the cart is cleared in checkout's onSuccess handler, not here.
  // Clearing it here too would wipe out any NEW items the user adds if they
  // revisit this confirmation page later (e.g. via back button or bookmark).

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrder(id),
    enabled: Boolean(id),
    staleTime: Infinity,
  });

  if (isLoading || !order) return <OrderConfirmedSkeleton />;

  const shortId = `#${order.id.slice(0, 8).toUpperCase()}`;
  const address = `${order.shippingAddress.street}, ${order.shippingAddress.city}`;
  const paymentLabel: Record<string, string> = {
    cod: "Cash on Delivery",
    payfast: "PayFast",
    jazzcash: "JazzCash",
    easypaisa: "Easypaisa",
    cod: "Cash on Delivery",
  };

  const infoRows = [
    { icon: Package, label: "Order", value: shortId },
    { icon: CreditCard, label: "Total", value: formatPrice(order.totalAmount) },
    {
      icon: CreditCard,
      label: "Payment",
      value: paymentLabel[order.paymentMethod] ?? order.paymentMethod,
    },
    { icon: MapPin, label: "Ship To", value: address },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-surface)]">
      {/* Checkmark */}
      <motion.div
        className="mb-7"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "backOut" }}
      >
        <AnimatedCheckmark />
      </motion.div>

      {/* Heading */}
      <motion.h1
        className="font-display text-4xl md:text-5xl text-[var(--color-primary)] mb-2 text-center font-light"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.45 }}
      >
        Order Confirmed
      </motion.h1>

      <motion.p
        className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)] mb-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        Thank you! Your order has been received.
      </motion.p>

      {/* Details card */}
      <motion.div
        className="w-full max-w-[420px] bg-white border border-[var(--color-border)] overflow-hidden mb-7"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.7 }}
      >
        {/* Dark header */}
        <div className="bg-[var(--color-primary)] px-6 py-4">
          <p className="text-[10px] tracking-[0.3em] uppercase font-[var(--font-inter)] font-bold text-white/60 mb-0.5">
            Summary
          </p>
          <p className="font-display text-2xl font-light text-white">{shortId}</p>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {infoRows.slice(1).map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-6 py-4">
              <span className="text-[10px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)]">
                {label}
              </span>
              <span className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-body)] font-medium text-right max-w-[55%]">
                {value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3 w-full max-w-[420px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.9 }}
      >
        <Link
          href="/products"
          className="flex-1 h-12 flex items-center justify-center border border-[var(--color-primary)] text-[var(--color-primary)] text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-primary)] hover:text-white transition-colors duration-200"
        >
          <ShoppingBag size={13} strokeWidth={1.5} className="mr-2" />
          Continue Shopping
        </Link>
        <Link
          href={`/account/orders/${id}`}
          className="flex-1 h-12 flex items-center justify-center bg-[var(--color-primary)] text-white text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors duration-200"
        >
          <Package size={13} strokeWidth={1.5} className="mr-2" />
          Track Order
        </Link>
      </motion.div>
    </div>
  );
}

export default function OrderConfirmedPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");

  return (
    <RequireAuth>
      <OrderConfirmedContent id={id} />
    </RequireAuth>
  );
}
