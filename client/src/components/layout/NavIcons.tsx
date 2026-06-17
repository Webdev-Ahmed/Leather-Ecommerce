"use client";

import { Search, User, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore, useCartItemCount } from "@/store/cart-store";
import { AccountDropdown } from "./AccountDropdown";

type NavIconsProps = {
  isScrolled: boolean;
  onSearchOpen: () => void;
};

export function NavIcons({ isScrolled, onSearchOpen }: NavIconsProps) {
  const { isAuthenticated } = useAuth();
  const itemCount = useCartItemCount();
  const openCart  = useCartStore((s) => s.openCart);

  const iconClass = cn(
    "transition-colors duration-200 cursor-pointer",
    isScrolled
      ? "text-[var(--color-text-primary)] hover:text-[var(--color-accent)]"
      : "text-[var(--color-primary-foreground)] hover:text-white/70",
  );

  return (
    <div className="flex items-center gap-5">
      {/* Search */}
      <button onClick={onSearchOpen} aria-label="Open search" className={iconClass}>
        <Search size={20} strokeWidth={1.5} />
      </button>

      {/* Account */}
      {isAuthenticated ? (
        <AccountDropdown />
      ) : (
        <button
          aria-label="Sign in"
          onClick={() => { window.location.href = "/login"; }}
          className={iconClass}
        >
          <User size={20} strokeWidth={1.5} />
        </button>
      )}

      {/* Cart */}
      <button
        onClick={openCart}
        aria-label={`Open cart — ${itemCount} items`}
        className={cn(iconClass, "relative")}
      >
        <ShoppingBag size={20} strokeWidth={1.5} />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-[var(--color-accent)] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        )}
      </button>
    </div>
  );
}
