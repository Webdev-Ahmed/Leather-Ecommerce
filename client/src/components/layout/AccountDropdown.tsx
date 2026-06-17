"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { LogOut, Package, MapPin, UserCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth-store";
import { useAuth } from "@/hooks/useAuth";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";

const LINKS = [
  { href: "/account/profile",   icon: UserCircle, label: "My Profile" },
  { href: "/account/orders",    icon: Package,    label: "My Orders"  },
  { href: "/account/addresses", icon: MapPin,     label: "Addresses"  },
] as const;

export function AccountDropdown() {
  const { isAuthenticated, logout } = useAuth();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, right: 0 });
  const timer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({
      top:   r.bottom + 10,                      // 10px gap below the avatar
      right: window.innerWidth - r.right,        // flush with right edge of avatar
    });
  }, []);

  function schedule() { timer.current = setTimeout(() => setOpen(false), 180); }
  function cancel()   { if (timer.current) clearTimeout(timer.current); }

  function handleOpen() {
    cancel();
    updatePos();
    setOpen(true);
  }

  // Reposition on resize
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", updatePos);
    return () => window.removeEventListener("resize", updatePos);
  }, [open, updatePos]);

  if (!isAuthenticated || !user) return null;

  return (
    <div
      className="relative"
      onMouseEnter={handleOpen}
      onMouseLeave={schedule}
    >
      {/* Trigger */}
      <button
        ref={triggerRef}
        aria-label="Account"
        aria-expanded={open}
        className="flex items-center cursor-pointer"
      >
        <InitialsAvatar name={user.name} size={28} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="acct-panel"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{ opacity: 0,   y: -4,  scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onMouseEnter={cancel}
            onMouseLeave={schedule}
            style={{
              position: "fixed",
              top:   pos.top,
              right: pos.right,
              zIndex: 400,
              width:  248,
            }}
          >
            {/* Thin pointer triangle */}
            <div
              className="absolute -top-[6px] right-[10px] w-3 h-3 bg-[var(--color-primary)] rotate-45 border-l border-t border-white/10"
              aria-hidden="true"
            />

            <div className="relative bg-white overflow-hidden"
              style={{ boxShadow: "0 8px 32px -4px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)" }}
            >
              {/* ── Identity header ── */}
              <div className="bg-[var(--color-primary)] px-5 py-4 flex items-center gap-3.5">
                <div style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>
                  <InitialsAvatar name={user.name} size={38} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[1rem] font-light text-white tracking-wide truncate leading-snug">
                    {user.name}
                  </p>
                  <p className="text-[10px] font-[var(--font-inter)] text-white/40 truncate mt-0.5 tracking-wide">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Gold line */}
              <div className="h-px bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent)]/30 to-transparent" />

              {/* ── Links ── */}
              <div className="py-1.5">
                {LINKS.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-[var(--color-accent-light)]"
                  >
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <Icon
                        size={13}
                        strokeWidth={1.5}
                        className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors"
                      />
                    </div>
                    <span className="flex-1 text-[11px] tracking-[0.12em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-body)] group-hover:text-[var(--color-primary)] transition-colors">
                      {label}
                    </span>
                    <ChevronRight
                      size={10}
                      strokeWidth={2}
                      className="text-[var(--color-border)] group-hover:text-[var(--color-accent)] transition-colors"
                    />
                  </Link>
                ))}
              </div>

              {/* ── Sign out ── */}
              <div className="border-t border-[var(--color-border)] mx-4 my-0" />
              <button
                onClick={() => { setOpen(false); logout(); }}
                className="group flex items-center gap-3 w-full px-4 py-3 transition-colors duration-150 hover:bg-red-50"
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <LogOut
                    size={13}
                    strokeWidth={1.5}
                    className="text-[var(--color-text-muted)] group-hover:text-red-500 transition-colors"
                  />
                </div>
                <span className="text-[11px] tracking-[0.12em] uppercase font-[var(--font-inter)] font-semibold text-[var(--color-text-muted)] group-hover:text-red-500 transition-colors">
                  Sign Out
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
