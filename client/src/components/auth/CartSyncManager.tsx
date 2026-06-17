"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { fetchServerCart, addToServerCart } from "@/api/cart";

/**
 * Mounts in Providers. Watches auth state and keeps the cart in sync.
 *
 * Also performs the manual zustand `persist` rehydration that
 * `skipHydration: true` (set on the cart store) deferred — see comment
 * in cart-store.ts for why this is necessary to avoid SSR hydration
 * mismatches.
 *
 * On login / page refresh (auth restored):
 *   1. GET /cart from server.
 *   2a. If server has items → use server as source of truth (covers page refresh).
 *   2b. If server is empty but localStorage has guest items → POST each guest
 *       item to server, then GET again (covers "add as guest, then log in").
 *
 * On logout:
 *   Clears the local cart so a subsequent user on the same device doesn't see
 *   the previous user's items.
 */
export function CartSyncManager() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  // Track the previous auth state so we can detect transitions
  const prevAuthenticated = useRef<boolean | null>(null);
  // Prevent double-sync within the same session
  const hasSynced = useRef(false);
  // Prevent double-rehydration across effect re-runs
  const hasRehydrated = useRef(false);

  useEffect(() => {
    const wasAuthenticated = prevAuthenticated.current;
    prevAuthenticated.current = isAuthenticated;

    // Still loading — wait
    if (isAuthLoading) return;

    async function run() {
      // ── Step 1: rehydrate from localStorage (guest cart) ────────────────
      // Must happen BEFORE any server sync below, so a slower server
      // response can't be overwritten by a late localStorage read.
      if (!hasRehydrated.current) {
        hasRehydrated.current = true;
        await useCartStore.persist.rehydrate();
      }

      // ── Guest / logged-out path — no server sync needed ─────────────────
      if (!isAuthenticated) {
        if (wasAuthenticated === true) {
          useCartStore.getState().clear();
        }
        hasSynced.current = false; // allow re-sync on next login
        useCartStore.getState().setSyncing(false); // unblock checkout immediately
        return;
      }

      // Already synced this session — skip
      if (hasSynced.current) return;
      hasSynced.current = true;

      // ── Authenticated — sync cart ──────────────────────────────────────
      try {
        const serverItems = await fetchServerCart();

        if (serverItems.length > 0) {
          // Server has items — server wins (handles page refresh correctly).
          // syncFromServer also sets isSyncing: false.
          useCartStore.getState().syncFromServer(serverItems);
        } else {
          // Server is empty — try to push any guest items up
          const localItems = useCartStore.getState().items;
          if (localItems.length > 0) {
            await Promise.allSettled(
              localItems.map((item) =>
                addToServerCart(
                  item.product.id,
                  item.variant?.id,
                  item.quantity,
                ),
              ),
            );
            // Re-fetch so we have server-assigned cartItemIds
            const freshItems = await fetchServerCart();
            if (freshItems.length > 0) {
              // At least some items made it — replace local with server state
              useCartStore.getState().syncFromServer(freshItems);
            } else {
              // All pushes failed (e.g. variant products without a variantId).
              // Keep the local items intact so the user doesn't lose their cart.
              useCartStore.getState().setSyncing(false);
            }
          } else {
            // Server empty, local empty — nothing to do, unblock checkout
            useCartStore.getState().setSyncing(false);
          }
        }
      } catch {
        // Sync failure is non-fatal — unblock checkout so the user isn't stuck
        useCartStore.getState().setSyncing(false);
      }
    }

    run();
  }, [isAuthenticated, isAuthLoading]);

  return null;
}
