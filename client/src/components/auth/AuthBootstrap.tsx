"use client";

import { useEffect, useRef } from "react";
import { getMe, refreshSession } from "@/api/auth";
import { useAuthStore } from "@/store/auth-store";

export function AuthBootstrap() {
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    let cancelled = false;
    const store = useAuthStore.getState();

    async function bootstrap() {
      store.setAuthLoading(true);

      try {
        let token = useAuthStore.getState().accessToken;

        if (!token) {
          token = await refreshSession();
          if (cancelled) return;
          useAuthStore.getState().setTokens(token);
        }

        const user = await getMe();
        if (cancelled) return;

        // Use login() for a single atomic update — guarantees CartSyncManager
        // sees isAuthenticated flip to true in one render, not split across two.
        useAuthStore.getState().login(token ?? "", user);
      } catch {
        if (cancelled) return;
        useAuthStore.getState().logout();
      } finally {
        if (!cancelled) {
          useAuthStore.getState().setAuthLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
