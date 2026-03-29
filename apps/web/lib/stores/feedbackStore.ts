import { create } from 'zustand'

interface FeedbackStore {
  isOpen: boolean
  sessionId: string | null
  open: (sessionId?: string) => void
  close: () => void
}

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  isOpen: false,
  sessionId: null,
  open: (sessionId) => set({ isOpen: true, sessionId: sessionId ?? null }),
  close: () => set({ isOpen: false, sessionId: null }),
}))
