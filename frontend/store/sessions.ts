// Path: store/sessions.ts
import { create } from "zustand";
import { getSessionStats, cleanupSessions } from "@/lib/api/voiceAssistantApi";
import type { SessionStats } from "@/lib/types";

type Store = {
  stats: SessionStats | null;
  loading: boolean;
  error: string | null;

  cleaning: boolean;
  cleanupResult: string | null;

  refresh: () => Promise<void>;
  cleanup: () => Promise<void>;
  clearResult: () => void;
};

export const useSessionsStore = create<Store>((set, get) => ({
  stats: null,
  loading: false,
  error: null,

  cleaning: false,
  cleanupResult: null,

  clearResult: () => set({ cleanupResult: null }),

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getSessionStats();
      set({ stats: res.data, loading: false, error: null });
    } catch (e: unknown) {
      set({
        stats: null,
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  cleanup: async () => {
    set({ cleaning: true, error: null, cleanupResult: null });
    try {
      const res = await cleanupSessions();
      set({
        cleaning: false,
        cleanupResult: `Cleanup done: deleted ${res.deleted}`,
      });
      // refresh stats after cleanup
      await get().refresh();
    } catch (e: unknown) {
      set({
        cleaning: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
}));