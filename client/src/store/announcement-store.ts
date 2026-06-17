import { create } from 'zustand'

type AnnouncementState = {
  isVisible: boolean
  dismiss: () => void
  init: () => void
}

const STORAGE_KEY = 'announcement-dismissed'

export const useAnnouncementStore = create<AnnouncementState>((set) => ({
  // Default false — init() is called client-side after sessionStorage check
  isVisible: false,

  init: () => {
    const dismissed = sessionStorage.getItem(STORAGE_KEY)
    set({ isVisible: !dismissed })
  },

  dismiss: () => {
    sessionStorage.setItem(STORAGE_KEY, '1')
    set({ isVisible: false })
  },
}))
