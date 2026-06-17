"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import type { ReactNode } from "react";

type GuestOnlyProps = {
  children: ReactNode;
};

// Redirects authenticated users away from auth pages (login/register).
// Shows nothing while auth is still loading to prevent flash.
export function GuestOnly({ children }: GuestOnlyProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace("/account/profile");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Don't flash the form while auth resolves or while redirecting
  if (isAuthLoading || isAuthenticated) return null;

  return <>{children}</>;
}
