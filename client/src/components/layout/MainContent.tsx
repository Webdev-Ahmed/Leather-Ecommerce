"use client";

import { useAnnouncementStore } from "@/store/announcement-store";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type MainContentProps = {
  children: ReactNode;
};

export function MainContent({ children }: MainContentProps) {
  const barVisible = useAnnouncementStore((s) => s.isVisible);

  return (
    <main>
      {/*
       * Spacer matching total fixed header height:
       *   mobile:  nav 60px  + bar 40px (conditional)
       *   tablet:  nav 64px  + bar 40px (conditional)
       *   desktop: nav 72px  + bar 40px (conditional)
       */}
      <div
        aria-hidden="true"
        className={cn(
          "transition-[height] duration-300",
          barVisible
            ? "h-[100px] md:h-[104px] lg:h-[112px]"
            : "h-[60px] md:h-[64px] lg:h-[72px]",
        )}
      />
      {children}
    </main>
  );
}
