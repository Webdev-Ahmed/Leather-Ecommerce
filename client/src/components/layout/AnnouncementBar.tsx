'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useAnnouncementStore } from '@/store/announcement-store'

const ANNOUNCEMENT_TEXT =
  'FREE DELIVERY ON ORDERS ABOVE RS 1,990 · DELIVERY IN 3–7 DAYS'

export function AnnouncementBar() {
  const { isVisible, dismiss, init } = useAnnouncementStore()

  useEffect(() => { init() }, [init])

  if (!isVisible) return null

  return (
    // h-10 = exactly 40px — must match BAR_HEIGHT constant in NavClient
    <div className="fixed top-0 left-0 w-full z-[60] h-10 flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-10">
      <p className="text-[10px] font-[var(--font-inter)] tracking-[0.18em] uppercase truncate pr-4">
        {ANNOUNCEMENT_TEXT}
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
