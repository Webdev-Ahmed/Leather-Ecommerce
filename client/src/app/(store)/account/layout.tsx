"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, MapPin, Package, LogOut, Truck, ChevronRight } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuthStore } from "@/store/auth-store";
import { logoutUser } from "@/api/auth";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Profile", href: "/account/profile", icon: User },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
  { label: "Track Order", href: "/account/tracking", icon: Truck },
] as const;

function AccountLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    try {
      await logoutUser();
      logout();
      toast.success("Logged out");
      router.push("/");
    } catch {
      toast.error("Could not log out.");
    }
  }

  return (
    <div className="bg-[var(--color-surface)] min-h-screen">
      {/* ── Mobile tab bar ── */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-[var(--color-border)] overflow-x-auto shadow-sm">
        <div className="flex min-w-max">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-5 py-4 text-[10px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold whitespace-nowrap border-b-2 transition-colors",
                  active
                    ? "text-[var(--color-primary)] border-[var(--color-accent)]"
                    : "text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-primary)]",
                )}
              >
                <Icon size={13} strokeWidth={1.5} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Desktop: sidebar + content ── */}
      <div className="max-w-[1400px] mx-auto lg:grid lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col bg-white border-r border-[var(--color-border)] min-h-[calc(100vh-112px)] sticky top-[112px]">
          {/* Avatar + name */}
          {user && (
            <div className="px-6 py-7 border-b border-[var(--color-border)] bg-[var(--color-primary)]">
              <div className="flex items-center gap-4">
                <InitialsAvatar name={user.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-light leading-tight text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] font-[var(--font-inter)] text-white/50 truncate mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex flex-col py-2 flex-1">
            {NAV.map(({ label, href, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3.5 text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold transition-all duration-150 group",
                    active
                      ? "bg-[var(--color-accent-light)] text-[var(--color-primary)] border-r-2 border-[var(--color-accent)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]",
                  )}
                >
                  <Icon size={14} strokeWidth={1.5} className="shrink-0" />
                  <span className="flex-1">{label}</span>
                  {active && (
                    <ChevronRight size={12} strokeWidth={2} className="opacity-40" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-5 border-t border-[var(--color-border)]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-[11px] tracking-[0.15em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-red-50 transition-all duration-150 rounded-sm"
            >
              <LogOut size={14} strokeWidth={1.5} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="px-5 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AccountLayoutInner>{children}</AccountLayoutInner>
    </RequireAuth>
  );
}
