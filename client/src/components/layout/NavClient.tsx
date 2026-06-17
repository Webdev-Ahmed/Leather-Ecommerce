"use client";

import { useState, useRef, useCallback } from "react";
import { Menu, ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useScrolled } from "@/hooks/useScrolled";
import { useAnnouncementStore } from "@/store/announcement-store";
import { usePathname } from "next/navigation";
import { NavLogo } from "./NavLogo";
import { NavIcons } from "./NavIcons";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import { SearchOverlay } from "./SearchOverlay";
import type { Category } from "@/types/api";

const BAR_HEIGHT    = 40;
const NAV_H_DESKTOP = 72;
const HERO_PAGES    = ["/"];
const MEGA_LABELS   = ["Men", "Women"] as const;
type MegaLabel = (typeof MEGA_LABELS)[number];

type NavClientProps = {
  categories: Category[];
};

export function NavClient({ categories }: NavClientProps) {
  const isScrolled   = useScrolled(80);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [activeLabel, setActiveLabel] = useState<MegaLabel | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barVisible = useAnnouncementStore((s) => s.isVisible);
  const pathname   = usePathname();

  const navTop    = barVisible ? BAR_HEIGHT : 0;
  const isHeroPage = HERO_PAGES.includes(pathname);
  const megaOpen  = activeLabel !== null;

  /**
   * isOpaque:
   *   - Always true when NOT on the hero page
   *   - Always true when scrolled past 80px
   *   - Always true when the mega menu is open (so the nav background shows)
   */
  const isOpaque = !isHeroPage || isScrolled || megaOpen;

  // MegaMenu sits at: announcement bar height + nav height
  const megaTopOffset = navTop + NAV_H_DESKTOP;

  // ── Hover timer — shared across all triggers ──────────────────────────────
  const openMega = useCallback((label: MegaLabel) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveLabel(label);
  }, []);

  const scheduleMegaClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveLabel(null), 150);
  }, []);

  const cancelMegaClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const closeMega = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveLabel(null);
  }, []);

  // ── Class builders ────────────────────────────────────────────────────────
  // NEVER add "relative" to navBase — it overrides "fixed"
  const navBase = cn(
    "fixed left-0 right-0 z-[210] transition-all duration-300",
    isOpaque
      ? "bg-[var(--color-surface-card)] border-b border-[var(--color-border)] shadow-sm"
      : "bg-transparent",
  );

  const linkClass = cn(
    "text-[11px] tracking-[0.18em] uppercase font-[var(--font-inter)] font-medium transition-colors duration-200 whitespace-nowrap",
    isOpaque
      ? "text-[var(--color-text-primary)] hover:text-[var(--color-accent)]"
      : "text-[var(--color-primary-foreground)] hover:text-white/70",
  );

  function megaTriggerClass(label: MegaLabel) {
    const active = activeLabel === label;
    return cn(
      "flex items-center gap-1 text-[11px] tracking-[0.18em] uppercase font-[var(--font-inter)] font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer select-none py-1",
      isOpaque
        ? active
          ? "text-[var(--color-accent)]"
          : "text-[var(--color-text-primary)] hover:text-[var(--color-accent)]"
        : active
          ? "text-[var(--color-accent)]"
          : "text-[var(--color-primary-foreground)] hover:text-white/70",
    );
  }

  return (
    <>
      {/* ── Header — purely fixed, never "relative" ── */}
      <header className={navBase} style={{ top: navTop }}>
        <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">

          {/* Desktop */}
          <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center h-[72px] gap-4">
            <div className="flex items-center gap-6 xl:gap-8">
              <Link href="/products" className={linkClass}>
                New Arrivals
              </Link>

              {MEGA_LABELS.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={megaTriggerClass(label)}
                  onMouseEnter={() => openMega(label)}
                  onMouseLeave={scheduleMegaClose}
                  onClick={() =>
                    setActiveLabel((prev) => (prev === label ? null : label))
                  }
                  aria-expanded={activeLabel === label}
                  aria-haspopup="true"
                >
                  {label}
                  <ChevronDown
                    size={11}
                    strokeWidth={2}
                    className={cn(
                      "mt-px transition-transform duration-200",
                      activeLabel === label && "rotate-180",
                    )}
                  />
                </button>
              ))}

              <Link href="/categories" className={linkClass}>
                All Categories
              </Link>
            </div>

            <NavLogo isScrolled={isOpaque} />

            <div className="flex justify-end">
              <NavIcons
                isScrolled={isOpaque}
                onSearchOpen={() => setSearchOpen(true)}
              />
            </div>
          </div>

          {/* Tablet */}
          <div className="hidden md:flex lg:hidden items-center justify-between h-[64px]">
            <NavLogo isScrolled={isOpaque} />
            <div className="flex items-center gap-4">
              <NavIcons isScrolled={isOpaque} onSearchOpen={() => setSearchOpen(true)} />
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className={cn(
                  "transition-colors duration-200",
                  isOpaque ? "text-[var(--color-text-primary)]" : "text-[var(--color-primary-foreground)]",
                )}
              >
                <Menu size={22} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center justify-between h-[60px]">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className={cn(
                "transition-colors duration-200 p-1 -ml-1",
                isOpaque ? "text-[var(--color-text-primary)]" : "text-[var(--color-primary-foreground)]",
              )}
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
            <NavLogo isScrolled={isOpaque} />
            <NavIcons isScrolled={isOpaque} onSearchOpen={() => setSearchOpen(true)} />
          </div>

        </nav>
      </header>

      {/*
       * MegaMenu is a sibling of the header — NOT a child.
       * As a sibling its z-[200] is evaluated at the root stacking context,
       * not scoped inside the header's z-[210].
       * Always passes isScrolled=true so the panel is always white.
       */}
      <MegaMenu
        activeLabel={activeLabel}
        topOffset={megaTopOffset}
        categories={categories}
        isScrolled={true}
        onMouseEnter={cancelMegaClose}
        onMouseLeave={scheduleMegaClose}
        onClose={closeMega}
      />

      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        categories={categories}
      />

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
