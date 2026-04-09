import { create } from 'zustand'
import type { ClientProfile, AgentActivity, Notification } from './types'
import type { Directive, AgentName } from './types'

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

  // Intelligence Bridge: Directives
  directives: Directive[]
  setDirectives: (d: Directive[]) => void
  addDirective: (d: Directive) => void
  dismissDirective: (id: string) => void

  // Agent Live Logs: selected agent
  selectedAgent: AgentName | null
  setSelectedAgent: (name: AgentName | null) => void
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

  directives: [],
  setDirectives: (directives) => set({ directives }),
  addDirective: (d) => set((s) => ({ directives: [d, ...s.directives] })),
  dismissDirective: (id) =>
    set((s) => ({
      directives: s.directives.filter((d) => d.id !== id),
    })),

  selectedAgent: null,
  setSelectedAgent: (selectedAgent) => set({ selectedAgent }),
}))
