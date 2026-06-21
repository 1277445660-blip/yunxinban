import { create } from 'zustand';

interface AdminState {
  alerts: any[];
  users: any[];
  stats: any;
  setAlerts: (alerts: any[]) => void;
  setUsers: (users: any[]) => void;
  setStats: (stats: any) => void;
  addAlert: (alert: any) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  alerts: [],
  users: [],
  stats: null,
  setAlerts: (alerts) => set({ alerts }),
  setUsers: (users) => set({ users }),
  setStats: (stats) => set({ stats }),
  addAlert: (alert) =>
    set((state) => ({ alerts: [alert, ...state.alerts] })),
}));
