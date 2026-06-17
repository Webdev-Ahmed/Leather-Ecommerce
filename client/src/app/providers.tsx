"use client";

import { getQueryClient } from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import { CartSyncManager } from "@/components/auth/CartSyncManager";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  // getQueryClient() returns a stable browser singleton — safe to call here
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      <CartSyncManager />
      {children}
    </QueryClientProvider>
  );
}
