import { create } from "zustand";
import { getReservations } from "@/lib/api/voiceAssistantApi";
import type { ReservationListItem } from "@/lib/types";

type Store = {
  q: string;
  rows: ReservationListItem[];
  count: number;
  loading: boolean;
  error: string | null;

  setQuery: (v: string) => void;
  refresh: () => Promise<void>;
};

export const useReservationsStore = create<Store>((set, get) => ({
  q: "",
  rows: [],
  count: 0,
  loading: false,
  error: null,

  setQuery: (v) => set({ q: v }),

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getReservations();
      set({ rows: res.data ?? [], count: res.count ?? (res.data?.length ?? 0) });
    } catch (e: unknown) {
      set({
        rows: [],
        count: 0,
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      set({ loading: false });
    }
  },
}));
