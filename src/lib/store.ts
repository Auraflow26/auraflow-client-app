import { create } from 'zustand'
import type { ClientProfile, AgentActivity, Notification } from './types'

interface AppState {
  profile: ClientProfile | null
  setProfile: (p: ClientProfile | null) => void

  unreadCount: number
  setUnreadCount: (n: number) => void

  notifications: Notification[]
  setNotifications: (n: Notification[]) => void

  activity: AgentActivity[]
  setActivity: (a: AgentActivity[]) => void
  addActivity: (a: AgentActivity) => void
}

export const useStore = create<AppState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),

  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount }),

  notifications: [],
  setNotifications: (notifications) => set({ notifications }),

  activity: [],
  setActivity: (activity) => set({ activity }),
  addActivity: (a) => set((s) => ({ activity: [a, ...s.activity].slice(0, 50) })),
}))
