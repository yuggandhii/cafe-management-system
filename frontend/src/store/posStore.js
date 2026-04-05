import { create } from 'zustand';

export const usePosStore = create((set) => ({
  activeSession: null,
  activePosConfig: null,
  activeTable: null,
  currentOrder: null,
  setSession: (session) => set({ activeSession: session }),
  setPosConfig: (config) => set({ activePosConfig: config }),
  setTable: (table) => set({ activeTable: table }),
  setOrder: (order) => set({ currentOrder: order }),
  clearPos: () => set({ activeSession: null, activePosConfig: null, activeTable: null, currentOrder: null }),
}));
