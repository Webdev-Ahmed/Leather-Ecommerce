"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "announcement-dismissed";
const ANNOUNCEMENT_TEXT =
  "GET FREE DELIVERY ON ALL ORDERS OF RS 1990 AND ABOVE, WITH DELIVERY WITHIN 3-7 DAYS.";

export function AnnouncementBar() {
  // Start hidden to avoid flash — reveal only after we confirm it's not dismissed
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (!dismissed) setIsVisible(true);
  }, []);

  function handleDismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <div className="relative bg-(--color-primary) text-(--color-primary-foreground) py-2.5 px-10 text-center">
      <p className="text-[11px] font-(--font-inter) tracking-[0.2em] uppercase">
        {ANNOUNCEMENT_TEXT}
      </p>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
