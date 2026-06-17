"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartActions } from "@/hooks/useCartActions";
import {
  useCartStore,
  useCartItemCount,
  useCartSubtotal,
  useCartDeliveryFee,
  useCartTotal,
  useCartAmountToFreeDelivery,
} from "@/store/cart-store";
import { useAnnouncementStore } from "@/store/announcement-store";
import { CartLineItem } from "./CartLineItem";
import { CartEmpty } from "./CartEmpty";
import { CartSummary } from "./CartSummary";
import { FreeDeliveryBar } from "./FreeDeliveryBar";

const BAR_HEIGHT    = 40;
const NAV_H_MOBILE  = 60;
const NAV_H_TABLET  = 64;
const NAV_H_DESKTOP = 72;

function getNavHeight() {
  if (typeof window === "undefined") return NAV_H_DESKTOP;
  if (window.innerWidth >= 1024) return NAV_H_DESKTOP;
  if (window.innerWidth >= 768)  return NAV_H_TABLET;
  return NAV_H_MOBILE;
}

export function CartDrawer() {
  const router = useRouter();
  const { clearCart } = useCartActions();
  const isOpen      = useCartStore((s) => s.isOpen);
  const closeCart   = useCartStore((s) => s.closeCart);
  const items       = useCartStore((s) => s.items);
  const itemCount   = useCartItemCount();
  const subtotal    = useCartSubtotal();
  const deliveryFee = useCartDeliveryFee();
  const total       = useCartTotal();
  const amountToFreeDelivery = useCartAmountToFreeDelivery();
  const barVisible  = useAnnouncementStore((s) => s.isVisible);

  const scrollRef = useRef<HTMLDivElement>(null);
  const barOffset = barVisible ? BAR_HEIGHT : 0;
  const topOffset = barOffset + getNavHeight();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeCart]);

  function handleCheckout() {
    closeCart();
    router.push("/checkout");
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop covers full screen so dimming looks right */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closeCart}
            className="fixed inset-0 z-[80] bg-black/50"
            aria-hidden="true"
          />

          {/* Panel — top offset keeps it below the nav */}
          <motion.div
            key="cart-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            style={{ top: topOffset }}
            className="fixed right-0 bottom-0 z-[90] w-full max-w-[400px] bg-white flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-[var(--color-primary)] shrink-0">
              <div className="flex items-center gap-3">
                <ShoppingBag size={16} strokeWidth={1.5} className="text-white/70" />
                <h2 className="text-[12px] tracking-[0.3em] uppercase font-[var(--font-inter)] font-semibold text-white">
                  Your Bag
                </h2>
                {itemCount > 0 && (
                  <span className="text-[11px] font-[var(--font-inter)] text-white/50">
                    ({itemCount} {itemCount === 1 ? "item" : "items"})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                {items.length > 0 && (
                  <button
                    onClick={() => void clearCart()}
                    aria-label="Clear bag"
                    title="Clear bag"
                    className="text-white/40 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                )}
                <button
                  onClick={closeCart}
                  aria-label="Close bag"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <CartEmpty />
            ) : (
              <>
                <FreeDeliveryBar
                  amountToFreeDelivery={amountToFreeDelivery}
                  subtotal={subtotal}
                />
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto scrollbar-thin px-6"
                >
                  {items.map((item) => (
                    <CartLineItem key={item.cartItemId} item={item} />
                  ))}
                </div>
                <CartSummary
                  subtotal={subtotal}
                  deliveryFee={deliveryFee}
                  total={total}
                  onCheckout={handleCheckout}
                />
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
