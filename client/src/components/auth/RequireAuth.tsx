"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

type RequireAuthProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

function DefaultFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="h-6 w-6 border-2 border-[var(--color-border)] border-t-[var(--color-text-primary)] rounded-full animate-spin" />
    </div>
  );
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !user)) {
      const next = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [isAuthLoading, isAuthenticated, user, router, pathname]);

  if (isAuthLoading || (isAuthenticated && !user)) {
    return fallback ?? <DefaultFallback />;
  }

  if (!isAuthenticated || !user) {
    return fallback ?? <DefaultFallback />;
  }

  return <>{children}</>;
}
