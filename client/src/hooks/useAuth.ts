"use client";

import { useAuthStore } from "@/store/auth-store";
import { logoutUser } from "@/api/auth";
import { useCartStore } from "@/store/cart-store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function useAuth() {
  const store = useAuthStore();
  const clearCart = useCartStore((s) => s.clear);
  const router = useRouter();

  async function handleLogout() {
    try {
      await logoutUser();
    } catch {
      // Continue logout even if the backend call fails
    } finally {
      store.logout();
      clearCart();
      router.push("/");
      toast.success("Logged out successfully.");
    }
  }

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated && Boolean(store.user),
    isAuthLoading: store.isAuthLoading,
    accessToken: store.accessToken,
    login: store.login,
    logout: handleLogout,
    setUser: store.setUser,
  };
}
