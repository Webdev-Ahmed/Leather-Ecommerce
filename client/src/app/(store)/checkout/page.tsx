"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  MapPin,
  Plus,
  ShoppingBag,
  Lock,
  ChevronRight,
  CheckCircle2,
  Phone,
  Banknote,
  XCircle,
} from "lucide-react";

import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  useCartStore,
  useCartSubtotal,
  useCartDeliveryFee,
  useCartTotal,
  useCartItemCount,
} from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import { useCartActions } from "@/hooks/useCartActions";
import { getAddresses, createAddress } from "@/api/addresses";
import { createOrder } from "@/api/orders";
import {
  initiatePayFast,
  initiateJazzCash,
  initiateEasypaisa,
  submitPaymentForm,
} from "@/api/payments";
import { cn, formatPrice } from "@/lib/utils";
import type { Address, CreateAddressInput, AppError, PaymentMethod } from "@/types/api";

// ─── Shared styles ────────────────────────────────────────────────────────────

const INPUT_BASE =
  "w-full h-11 border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-[13px] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:bg-white transition-all";

const LABEL_BASE =
  "block text-[10px] tracking-[0.22em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] mb-2";

const SECTION_HEADING =
  "text-[11px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)]";

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block w-5 h-5 border-2 border-current/20 border-t-current rounded-full animate-spin",
        className,
      )}
    />
  );
}

// ─── Address form ─────────────────────────────────────────────────────────────

type AddressFormValues = {
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function AddAddressForm({
  onSuccess,
  onCancel,
  showCancel,
}: {
  onSuccess: (address: Address) => void;
  onCancel?: () => void;
  showCancel: boolean;
}) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressFormValues>({
    defaultValues: { label: "", street: "", city: "", state: "", postalCode: "", country: "" },
  });

  const mutation = useMutation<Address, AppError, CreateAddressInput>({
    mutationFn: createAddress,
    onSuccess: (newAddress) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      reset();
      onSuccess(newAddress);
      toast.success("Address saved.");
    },
    onError: (err) => toast.error(err.message ?? "Could not save address."),
  });

  function onSubmit(values: AddressFormValues) {
    const input: CreateAddressInput = {
      street: values.street,
      city: values.city,
      state: values.state,
      postalCode: values.postalCode,
      country: values.country,
    };
    if (values.label.trim()) input.label = values.label.trim();
    mutation.mutate(input);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-[var(--color-primary)] p-5 mt-4 space-y-4">
      <p className={cn(SECTION_HEADING, "text-[var(--color-primary)] mb-1")}>New Address</p>
      <div>
        <label className={LABEL_BASE}>Label <span className="normal-case tracking-normal text-[9px] opacity-50 font-normal">optional</span></label>
        <input {...register("label")} placeholder="e.g. Home, Office" className={INPUT_BASE} />
      </div>
      <div>
        <label className={LABEL_BASE}>Street Address *</label>
        <input {...register("street", { required: "Required" })} placeholder="House 12, Street 3" className={cn(INPUT_BASE, errors.street && "border-[var(--color-danger)] bg-red-50/50")} />
        {errors.street && <p className="mt-1 text-[11px] text-[var(--color-danger)]">{errors.street.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_BASE}>City *</label>
          <input {...register("city", { required: "Required" })} placeholder="Karachi" className={cn(INPUT_BASE, errors.city && "border-[var(--color-danger)] bg-red-50/50")} />
          {errors.city && <p className="mt-1 text-[11px] text-[var(--color-danger)]">{errors.city.message}</p>}
        </div>
        <div>
          <label className={LABEL_BASE}>Province *</label>
          <input {...register("state", { required: "Required" })} placeholder="Sindh" className={cn(INPUT_BASE, errors.state && "border-[var(--color-danger)] bg-red-50/50")} />
          {errors.state && <p className="mt-1 text-[11px] text-[var(--color-danger)]">{errors.state.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_BASE}>Postal Code *</label>
          <input {...register("postalCode", { required: "Required" })} placeholder="75500" className={cn(INPUT_BASE, errors.postalCode && "border-[var(--color-danger)] bg-red-50/50")} />
          {errors.postalCode && <p className="mt-1 text-[11px] text-[var(--color-danger)]">{errors.postalCode.message}</p>}
        </div>
        <div>
          <label className={LABEL_BASE}>Country *</label>
          <input {...register("country", { required: "Required" })} placeholder="Pakistan" className={cn(INPUT_BASE, errors.country && "border-[var(--color-danger)] bg-red-50/50")} />
          {errors.country && <p className="mt-1 text-[11px] text-[var(--color-danger)]">{errors.country.message}</p>}
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={mutation.isPending}
          className="h-11 px-7 bg-[var(--color-primary)] text-white text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold hover:bg-[var(--color-accent)] transition-colors disabled:opacity-50 flex items-center gap-2">
          {mutation.isPending ? <><Spinner className="w-3.5 h-3.5 border-t-white" /> Saving…</> : "Save Address"}
        </button>
        {showCancel && onCancel && (
          <button type="button" onClick={onCancel}
            className="h-11 px-5 border border-[var(--color-border)] text-[11px] tracking-[0.2em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Address radio item ───────────────────────────────────────────────────────

function AddressRadioItem({
  address,
  selected,
  onSelect,
}: {
  address: Address;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <label className={cn(
      "flex items-start gap-3.5 border p-4 cursor-pointer transition-all duration-150",
      selected ? "border-[var(--color-primary)] bg-white shadow-sm" : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]/50",
    )}>
      <input type="radio" name="address" value={address.id} checked={selected}
        onChange={() => onSelect(address.id)} className="sr-only" />
      <span className={cn(
        "mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
        selected ? "border-[var(--color-primary)]" : "border-[var(--color-border)]",
      )}>
        {selected && <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
      </span>
      <div className="flex-1 min-w-0">
        {address.label && (
          <p className="text-[10px] tracking-[0.18em] uppercase font-[var(--font-inter)] font-bold text-[var(--color-primary)] mb-1">
            {address.label}
          </p>
        )}
        <p className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-body)] leading-relaxed">
          {address.street}
        </p>
        <p className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p className="text-[12px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
          {address.country}
        </p>
      </div>
      {address.isDefault && (
        <span className="shrink-0 inline-flex items-center gap-1 text-[9px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-bold text-[var(--color-accent)] bg-[var(--color-accent-light)] px-2 py-0.5 mt-0.5">
          <CheckCircle2 size={8} strokeWidth={2.5} /> Default
        </span>
      )}
    </label>
  );
}

// ─── Payment method radio ─────────────────────────────────────────────────────

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  sub: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "cod",
    label: "Cash on Delivery",
    sub: "Pay when your order arrives",
    icon: <Banknote size={18} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />,
  },
  {
    value: "jazzcash",
    label: "JazzCash",
    sub: "Pay via JazzCash mobile wallet",
    icon: (
      <span className="w-[18px] h-[18px] flex items-center justify-center rounded text-[8px] font-bold bg-red-500 text-white leading-none">
        JC
      </span>
    ),
  },
  {
    value: "easypaisa",
    label: "Easypaisa",
    sub: "Pay via Easypaisa mobile wallet",
    icon: (
      <span className="w-[18px] h-[18px] flex items-center justify-center rounded text-[8px] font-bold bg-green-600 text-white leading-none">
        EP
      </span>
    ),
  },
  {
    value: "payfast",
    label: "PayFast",
    sub: "Debit / credit card via PayFast",
    icon: <Lock size={14} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />,
  },
];

// ─── Checkout inner ───────────────────────────────────────────────────────────

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Payment gateway error/cancel callbacks
  const paymentError = searchParams.get("error");
  const wasCancelled = searchParams.get("cancelled") === "true";
  const failedOrderId = searchParams.get("orderId");

  const PAYMENT_ERROR_MESSAGES: Record<string, string> = {
    jazzcash_failed: "Your JazzCash payment could not be completed.",
    jazzcash_invalid: "Invalid JazzCash session. Please try again.",
    jazzcash_order_not_found: "Order not found. Please contact support.",
    jazzcash_verification_failed: "Payment verification failed. Please contact support.",
  };
  const items       = useCartStore((s) => s.items);
  const subtotal    = useCartSubtotal();
  const deliveryFee = useCartDeliveryFee();
  const total       = useCartTotal();
  const itemCount   = useCartItemCount();
  const isSyncing   = useCartStore((s) => s.isSyncing);
  const { clearCart } = useCartActions();
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  // Easypaisa optionally takes a mobile number
  const [mobileNumber, setMobileNumber] = useState("");

  const { data: addresses, isLoading: addressesLoading } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn: getAddresses,
    enabled: !isAuthLoading,
  });

  useEffect(() => {
    if (addressesLoading) return;
    if (!addresses || addresses.length === 0) { setShowAddForm(true); return; }
    setShowAddForm(false);
    setSelectedAddressId((prev) => {
      if (prev && addresses.find((a) => a.id === prev)) return prev;
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      return def?.id ?? null;
    });
  }, [addresses, addressesLoading]);

  // Step 1: create the order record
  const orderMutation = useMutation<
    Awaited<ReturnType<typeof createOrder>>,
    AppError
  >({
    mutationFn: () =>
      createOrder({ paymentMethod, addressId: selectedAddressId ?? undefined }),
    onSuccess: async (order) => {
      if (paymentMethod === "cod") {
        // COD: clear cart immediately and navigate to confirmation
        await clearCart();
        router.push(`/order-confirmed/${order.id}`);
        return;
      }

      // Online payment: redirect to gateway then clear cart after return
      try {
        if (paymentMethod === "payfast") {
          const { payfastUrl, formData } = await initiatePayFast(order.id);
          await clearCart();
          submitPaymentForm(payfastUrl, formData);
        } else if (paymentMethod === "jazzcash") {
          const { jazzcashUrl, formData } = await initiateJazzCash(order.id);
          await clearCart();
          submitPaymentForm(jazzcashUrl, formData);
        } else if (paymentMethod === "easypaisa") {
          const { easypaisaUrl, formData } = await initiateEasypaisa(
            order.id,
            mobileNumber.trim() || undefined,
          );
          await clearCart();
          // Navigate to payment-pending FIRST — the form submit will redirect
          // the browser to Easypaisa's hosted page. Since Easypaisa uses
          // server-to-server callbacks (no browser redirect back), we need the
          // user to land on our polling page, not be left at the gateway.
          router.push(`/payment-pending/${order.id}`);
          // Small delay to let Next.js start the navigation before the form
          // POST hijacks the browser tab.
          setTimeout(() => submitPaymentForm(easypaisaUrl, formData), 300);
        }
      } catch (payErr) {
        const appErr = payErr as AppError;
        toast.error(
          appErr.message ??
            "Order created but payment failed to initiate. Please contact support.",
        );
      }
    },
    onError: (err) => {
      toast.error(err.message ?? "Could not place order. Please try again.");
    },
  });

  useEffect(() => {
    if (!isAuthLoading && !isSyncing && itemCount === 0) {
      router.replace("/products");
    }
  }, [isAuthLoading, isSyncing, itemCount, router]);

  if (isAuthLoading || isSyncing || itemCount === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner className="w-6 h-6 text-[var(--color-text-muted)]" />
      </div>
    );
  }

  const canPlace = !!selectedAddressId && !orderMutation.isPending;
  const isProcessing = orderMutation.isPending;

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase font-[var(--font-inter)] text-[var(--color-text-muted)] mb-6">
        <Link href="/products" className="hover:text-[var(--color-accent)] transition-colors flex items-center gap-1">
          <ArrowLeft size={10} strokeWidth={2} /> Shop
        </Link>
        <ChevronRight size={10} strokeWidth={1.5} className="opacity-40" />
        <span className="text-[var(--color-primary)] font-semibold">Checkout</span>
      </nav>

      <h1 className="font-display text-3xl lg:text-4xl font-light text-[var(--color-primary)] mb-8">
        Checkout
      </h1>

      {/* Payment gateway error banner */}
      {(paymentError || wasCancelled) && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3.5 border border-[var(--color-danger)]/30 bg-red-50">
          <XCircle size={16} strokeWidth={1.5} className="text-[var(--color-danger)] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] font-[var(--font-inter)] font-semibold text-[var(--color-danger)]">
              {wasCancelled
                ? "Payment cancelled — your order has not been charged."
                : (PAYMENT_ERROR_MESSAGES[paymentError!] ?? "Your payment could not be completed.")}
            </p>
            {failedOrderId && (
              <p className="text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)] mt-1">
                Your order{" "}
                <Link href={`/account/orders/${failedOrderId}`} className="text-[var(--color-accent)] hover:underline">
                  #{failedOrderId.slice(0, 8).toUpperCase()}
                </Link>{" "}
                was created but payment failed. You can retry payment from your order page.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* ── Left column ── */}
        <div className="space-y-6">

          {/* Address */}
          <section className="bg-white border border-[var(--color-border)]">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <MapPin size={13} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
              <p className={SECTION_HEADING}>Delivery Address</p>
            </div>
            <div className="p-5">
              {addressesLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <Spinner className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <span className="text-[13px] font-[var(--font-inter)] text-[var(--color-text-muted)]">Loading addresses…</span>
                </div>
              ) : (
                <>
                  {addresses && addresses.length > 0 && (
                    <div className="space-y-2.5">
                      {addresses.map((addr) => (
                        <AddressRadioItem
                          key={addr.id}
                          address={addr}
                          selected={selectedAddressId === addr.id}
                          onSelect={setSelectedAddressId}
                        />
                      ))}
                    </div>
                  )}
                  {addresses && addresses.length > 0 && !showAddForm && (
                    <button onClick={() => setShowAddForm(true)}
                      className="mt-4 inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] border border-[var(--color-border)] px-4 py-2.5 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                      <Plus size={12} strokeWidth={2} /> Add New Address
                    </button>
                  )}
                  {showAddForm && (
                    <AddAddressForm
                      showCancel={!!(addresses && addresses.length > 0)}
                      onCancel={() => setShowAddForm(false)}
                      onSuccess={(a) => { setSelectedAddressId(a.id); setShowAddForm(false); }}
                    />
                  )}
                </>
              )}
            </div>
          </section>

          {/* Payment method */}
          <section className="bg-white border border-[var(--color-border)]">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <Lock size={13} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
              <p className={SECTION_HEADING}>Payment Method</p>
            </div>
            <div className="p-5 space-y-2.5">
              {PAYMENT_METHODS.map((pm) => {
                const selected = paymentMethod === pm.value;
                return (
                  <label
                    key={pm.value}
                    className={cn(
                      "flex items-center gap-3.5 border p-4 cursor-pointer transition-all duration-150",
                      selected
                        ? "border-[var(--color-primary)] bg-white shadow-sm"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={pm.value}
                      checked={selected}
                      onChange={() => setPaymentMethod(pm.value)}
                      className="sr-only"
                    />
                    <span className={cn(
                      "shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                      selected ? "border-[var(--color-primary)]" : "border-[var(--color-border)]",
                    )}>
                      {selected && <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
                    </span>
                    <span className="shrink-0">{pm.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[13px] font-[var(--font-inter)] font-semibold leading-tight",
                        selected ? "text-[var(--color-primary)]" : "text-[var(--color-text-body)]",
                      )}>{pm.label}</p>
                      <p className="text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)] mt-0.5">
                        {pm.sub}
                      </p>
                    </div>
                  </label>
                );
              })}

              {/* Easypaisa mobile number field */}
              {paymentMethod === "easypaisa" && (
                <div className="pt-2 pl-1">
                  <label className={cn(LABEL_BASE, "mb-2")}>
                    <Phone size={10} className="inline mr-1" />
                    Easypaisa Mobile Number{" "}
                    <span className="normal-case tracking-normal text-[9px] opacity-50 font-normal">optional</span>
                  </label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="03XX XXXXXXX"
                    className={INPUT_BASE}
                  />
                  <p className="mt-1.5 text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)]">
                    Pre-fill your number to skip the step on Easypaisa&apos;s checkout.
                  </p>
                </div>
              )}

              {/* Online payment notice */}
              {paymentMethod !== "cod" && (
                <div className="flex items-start gap-2.5 mt-1 px-4 py-3 bg-[var(--color-accent-light)] border border-[var(--color-accent)]/30">
                  <Lock size={12} strokeWidth={2} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
                  <p className="text-[11px] font-[var(--font-inter)] text-[var(--color-text-body)] leading-relaxed">
                    You&apos;ll be redirected to{" "}
                    <span className="font-semibold capitalize">{paymentMethod}</span>&apos;s
                    secure checkout to complete payment.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Right: order summary ── */}
        <aside className="sticky top-24 self-start">
          <div className="bg-white border border-[var(--color-border)] overflow-hidden">
            <div className="bg-[var(--color-primary)] px-5 py-4 flex items-center gap-2">
              <ShoppingBag size={14} strokeWidth={1.5} className="text-white/60" />
              <p className="text-[11px] tracking-[0.25em] uppercase font-[var(--font-inter)] font-bold text-white">
                Order Summary
              </p>
              <span className="ml-auto text-[11px] font-[var(--font-inter)] text-white/50">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="p-5">
              {/* Items */}
              <ul className="space-y-4 mb-5">
                {items.map((item) => {
                  const unitPrice = item.variant?.priceOverride ?? item.product.discountPrice ?? item.product.price;
                  const lineTotal = unitPrice * item.quantity;
                  const imageUrl = item.variant?.images[0] ?? item.product.images[0];
                  const variantLabel = [item.variant?.color, item.variant?.size].filter(Boolean).join(" / ");
                  return (
                    <li key={item.cartItemId} className="flex gap-3">
                      <div className="relative shrink-0 w-12 h-14 bg-[var(--color-accent-light)] overflow-hidden">
                        <Image src={imageUrl ?? "/images/placeholder.jpg"} alt={item.product.name} fill sizes="48px" className="object-cover"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/placeholder.jpg"; }} />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-primary)] text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-[var(--font-inter)] font-semibold text-[var(--color-text-body)] leading-snug line-clamp-2">
                          {item.product.name}
                        </p>
                        {variantLabel && (
                          <p className="text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)] mt-0.5">{variantLabel}</p>
                        )}
                      </div>
                      <p className="shrink-0 text-[13px] font-bold font-price tabular-nums text-[var(--color-text-body)]">
                        {formatPrice(lineTotal)}
                      </p>
                    </li>
                  );
                })}
              </ul>

              {/* Totals */}
              <div className="border-t border-[var(--color-border)] pt-4 space-y-2.5">
                <div className="flex justify-between text-[13px] font-[var(--font-inter)]">
                  <span className="text-[var(--color-text-muted)]">Subtotal</span>
                  <span className="font-price tabular-nums font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[13px] font-[var(--font-inter)]">
                  <span className="text-[var(--color-text-muted)]">Delivery</span>
                  {deliveryFee === 0
                    ? <span className="text-[var(--color-success)] font-semibold">Free</span>
                    : <span className="font-price tabular-nums font-medium">{formatPrice(deliveryFee)}</span>}
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[var(--color-border)]">
                  <span className={SECTION_HEADING}>Total</span>
                  <span className="text-xl font-bold font-price tabular-nums text-[var(--color-primary)]">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 pb-5">
              <button
                type="button"
                disabled={!canPlace}
                onClick={() => orderMutation.mutate()}
                className={cn(
                  "w-full h-12 text-[11px] tracking-[0.3em] uppercase font-[var(--font-inter)] font-bold transition-all duration-200 flex items-center justify-center gap-2",
                  canPlace
                    ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-accent)]"
                    : "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed",
                )}
              >
                {isProcessing ? (
                  <><Spinner className="w-4 h-4 border-t-white" /> {paymentMethod === "cod" ? "Placing Order…" : "Redirecting…"}</>
                ) : (
                  <><Lock size={13} strokeWidth={2} />
                    {paymentMethod === "cod" ? "Place Order" : `Pay with ${PAYMENT_METHODS.find((p) => p.value === paymentMethod)?.label ?? paymentMethod}`}
                  </>
                )}
              </button>

              {!selectedAddressId && !addressesLoading && (
                <p className="text-center text-[11px] font-[var(--font-inter)] text-[var(--color-text-muted)] mt-3">
                  Select a delivery address to continue
                </p>
              )}

              <p className="text-center text-[10px] font-[var(--font-inter)] text-[var(--color-text-muted)] mt-3 flex items-center justify-center gap-1">
                <Lock size={9} strokeWidth={1.5} /> Secure & encrypted checkout
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutInner />
    </RequireAuth>
  );
}
