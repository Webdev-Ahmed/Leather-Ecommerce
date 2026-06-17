import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartProduct, ProductVariant } from "@/types/api";
import type { ServerCartItem } from "@/api/cart";

// ─── Constants ────────────────────────────────────────────────────────────────

export const MAX_CART_ITEMS = 20;
const FREE_DELIVERY_THRESHOLD = 1990;

// ─── Types ────────────────────────────────────────────────────────────────────

export type CartItem = {
  cartItemId: string; // CartItem row id from backend — used for PUT/DELETE
  product: CartProduct; // Minimal product shape (id, name, slug, price, etc.)
  variant: ProductVariant | null;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  /**
   * True from the moment the app boots until the first server sync resolves
   * (or until we confirm the user is a guest and no sync is needed).
   * Checkout and other auth-gated pages read this to avoid premature
   * "cart is empty" redirects during the bootstrap window.
   */
  isSyncing: boolean;
};

type CartActions = {
  setSyncing: (value: boolean) => void;
  addItem: (
    product: CartProduct,
    variant: ProductVariant | null,
    quantity: number,
    cartItemId: string,
  ) => void;
  updateItem: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  /** Replace the entire local cart with the server's cart (called after auth). */
  syncFromServer: (serverItems: ServerCartItem[]) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
};

export type CartStore = CartState & CartActions;

// ─── Derived value helpers ────────────────────────────────────────────────────
// NOTE: these used to be defined as `get subtotal() { ... }` getters directly
// on the persisted zustand state object. That broke after any rehydration:
// zustand persist's default `merge` does
//   { ...currentState, ...persistedState }
// which SPREADS currentState — this evaluates every getter immediately and
// copies its *current return value* as a plain property, while persistedState
// only contains the partialized `items`. Since this runs the moment
// `persist.rehydrate()` resolves (i.e. right as `items` flips from `[]` to the
// restored cart), `subtotal`/`total`/`deliveryFee`/`itemCount` got frozen at
// the stale "empty cart" values (0 / 200 delivery / 200 total / 0 items) and
// every subsequent `set()` call (which itself spreads `state`) kept
// propagating those stale plain numbers forever — hence "Subtotal: RS. 0" and
// "Total: RS. 200" while the bag visibly held an RS. 1,500 item, and the
// checkout page bouncing the user out because `itemCount` read as 0.
//
// Fix: never store derived values as state. Compute them on demand from
// `items` via plain functions, and expose them through selector hooks below
// so components still get reactive, memo-friendly values.

function calcItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function calcSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const price =
      item.variant?.priceOverride ??
      item.product.discountPrice ??
      item.product.price;
    return sum + price * item.quantity;
  }, 0);
}

function calcDeliveryFee(items: CartItem[]): number {
  return calcSubtotal(items) >= FREE_DELIVERY_THRESHOLD ? 0 : 200;
}

function calcTotal(items: CartItem[]): number {
  return calcSubtotal(items) + calcDeliveryFee(items);
}

function calcAmountToFreeDelivery(items: CartItem[]): number {
  return Math.max(0, FREE_DELIVERY_THRESHOLD - calcSubtotal(items));
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isSyncing: true,

      // ─── Actions ──────────────────────────────────────────────────────────

      addItem: (product, variant, quantity, cartItemId) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.cartItemId === cartItemId,
          );
          const maxStock = variant?.stock ?? product.stock;

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.cartItemId === cartItemId
                  ? {
                      ...item,
                      quantity: Math.min(
                        item.quantity + quantity,
                        maxStock,
                        MAX_CART_ITEMS,
                      ),
                    }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                cartItemId,
                product,
                variant,
                quantity: Math.min(quantity, maxStock, MAX_CART_ITEMS),
              },
            ],
          };
        });
      },

      updateItem: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId
              ? {
                  ...item,
                  quantity: Math.min(
                    quantity,
                    item.variant?.stock ?? item.product.stock,
                    MAX_CART_ITEMS,
                  ),
                }
              : item,
          ),
        }));
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        }));
      },

      setSyncing: (value) => set({ isSyncing: value }),

      syncFromServer: (serverItems) => {
        set({
          isSyncing: false,
          items: serverItems.map((item) => ({
            cartItemId: item.id,
            product: item.product,
            variant: item.variant,
            quantity: item.quantity,
          })),
        });
      },

      clear: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: "leather-cart",
      partialize: (state) => ({ items: state.items }),
      /**
       * CRITICAL for SSR: without this, zustand's persist middleware
       * synchronously reads localStorage during store creation on the
       * client — meaning the client's FIRST (hydration-matching) render
       * already has the persisted `items`, while the server-rendered HTML
       * always has `items: []` (no localStorage on the server).
       *
       * This produced "hydrated but some attributes didn't match" errors
       * on the cart badge (<span> present/absent), CartDrawer empty-state,
       * FreeDeliveryBar progress, etc.
       *
       * With skipHydration, the client's initial render also starts from
       * `items: []` (matching SSR). We then call
       * `useCartStore.persist.rehydrate()` manually inside a useEffect in
       * CartSyncManager — a normal post-mount state update, which React
       * allows to differ from the SSR snapshot without warning.
       */
      skipHydration: true,
    },
  ),
);

// ─── Derived value selector hooks ─────────────────────────────────────────────
// Use these instead of reading subtotal/total/etc. off the store directly —
// they're computed fresh from `items` on every call, so they can never go
// stale the way the old in-state getters did across a persist rehydration.

export function useCartItemCount(): number {
  return useCartStore((s) => calcItemCount(s.items));
}

export function useCartSubtotal(): number {
  return useCartStore((s) => calcSubtotal(s.items));
}

export function useCartDeliveryFee(): number {
  return useCartStore((s) => calcDeliveryFee(s.items));
}

export function useCartTotal(): number {
  return useCartStore((s) => calcTotal(s.items));
}

export function useCartAmountToFreeDelivery(): number {
  return useCartStore((s) => calcAmountToFreeDelivery(s.items));
}
