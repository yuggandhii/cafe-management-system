import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  setAuth: ({ user, accessToken }) => set((s) => ({
    user: user ?? s.user,
    accessToken: accessToken ?? s.accessToken,
  })),
  clearAuth: () => set({ user: null, accessToken: null }),
}));
