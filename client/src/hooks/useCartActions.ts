"use client";

import toast from "react-hot-toast";
import { useCartStore, MAX_CART_ITEMS } from "@/store/cart-store";
import { useAuthStore } from "@/store/auth-store";
import {
  addToServerCart,
  updateServerCartItem,
  removeFromServerCart,
  clearServerCart,
} from "@/api/cart";
import type { CartProduct, ProductVariant } from "@/types/api";

export function useCartActions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const syncFromServer = useCartStore((s) => s.syncFromServer);
  const addItemLocal = useCartStore((s) => s.addItem);
  const updateItemLocal = useCartStore((s) => s.updateItem);
  const removeItemLocal = useCartStore((s) => s.removeItem);
  const clearLocal = useCartStore((s) => s.clear);
  const openCart = useCartStore((s) => s.openCart);

  /**
   * Add a product/variant to the cart.
   *
   * IMPORTANT: Before adding a new line, check whether the same product+variant
   * combination is already in the cart. If it is, increment that line's
   * quantity instead of creating a duplicate line item.
   *
   * (Previously this always generated a fresh `crypto.randomUUID()` and called
   * addItemLocal, which meant the cart-store's own "existing item" check could
   * never match — every "Add to Bag" click on the same product created a new
   * separate line. For guest users (no syncFromServer to dedupe) those
   * duplicates persisted permanently.)
   */
  async function addToCart(
    product: CartProduct,
    variant: ProductVariant | null,
    quantity: number,
  ): Promise<void> {
    const items = useCartStore.getState().items;
    const existing = items.find(
      (item) =>
        item.product.id === product.id &&
        (item.variant?.id ?? null) === (variant?.id ?? null),
    );

    if (existing) {
      const maxStock = variant?.stock ?? product.stock;
      const nextQuantity = Math.min(
        existing.quantity + quantity,
        maxStock,
        MAX_CART_ITEMS,
      );

      // 1. Optimistic local update — bump the existing line's quantity
      updateItemLocal(existing.cartItemId, nextQuantity);

      if (!isAuthenticated) return;

      // 2. Persist to server in the background
      try {
        const serverCart = await updateServerCartItem(
          existing.cartItemId,
          nextQuantity,
        );
        syncFromServer(serverCart.items);
      } catch (err) {
        // If the existing line was a temp (client-only) id that never made it
        // to the server, fall back to creating it server-side now.
        try {
          const serverCart = await addToServerCart(
            product.id,
            variant?.id,
            nextQuantity,
          );
          syncFromServer(serverCart.items);
        } catch {
          throw err;
        }
      }
      return;
    }

    // No existing line for this product+variant — add a new one.
    const tempId = crypto.randomUUID();

    // 1. Optimistic local add — instant feedback regardless of auth status
    addItemLocal(product, variant, quantity, tempId);

    if (!isAuthenticated) return;

    // 2. Persist to server in the background
    try {
      const serverCart = await addToServerCart(
        product.id,
        variant?.id,
        quantity,
      );
      // Replace entire local cart with the server's authoritative state
      // (this also swaps the temp UUID for the real cartItemId)
      syncFromServer(serverCart.items);
    } catch (err) {
      // Server rejected the add — keep the optimistic item so the cart is
      // never silently cleared by a network hiccup or transient server error.
      // Re-throw so callers can show an error toast.
      throw err;
    }
  }

  /**
   * Change the quantity of an existing cart item.
   * Optimistic local update; server call fires in the background.
   */
  async function updateCart(
    cartItemId: string,
    quantity: number,
  ): Promise<void> {
    updateItemLocal(cartItemId, quantity);
    if (!isAuthenticated) return;

    try {
      if (quantity <= 0) {
        await removeFromServerCart(cartItemId);
      } else {
        await updateServerCartItem(cartItemId, quantity);
      }
    } catch {
      toast.error("Failed to update cart. Refresh to re-sync.");
    }
  }

  /**
   * Remove a single item. Optimistic local remove.
   */
  async function removeFromCart(cartItemId: string): Promise<void> {
    removeItemLocal(cartItemId);
    if (!isAuthenticated) return;

    try {
      await removeFromServerCart(cartItemId);
    } catch {
      toast.error("Failed to remove item. Refresh to re-sync.");
    }
  }

  /**
   * Clear the entire cart (local + server, if authenticated).
   * Optimistic local clear.
   */
  async function clearCart(): Promise<void> {
    clearLocal();
    if (!isAuthenticated) return;

    try {
      await clearServerCart();
    } catch {
      toast.error("Failed to clear cart. Refresh to re-sync.");
    }
  }

  return { addToCart, updateCart, removeFromCart, clearCart, openCart };
}
