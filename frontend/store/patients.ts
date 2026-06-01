// Path: store/patients.ts
import { create } from "zustand";
import type { Patient } from "@/lib/types";
import { searchPatients } from "@/lib/api/voiceAssistantApi";

type Store = {
  q: string;
  limit: number;
  offset: number;

  rows: Patient[];
  count: number;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  lastKey: string | null;

  setQuery: (v: string) => void;
  setLimit: (n: number) => void;
  setOffset: (n: number) => void;

  refresh: () => Promise<void>;
};

const CACHE_TTL_MS = 8000;

// Sent as `q` when the search box is empty so the backend returns every
// patient (ILIKE '%%%' matches all). See refresh() for details.
const MATCH_ALL_QUERY = "%";

function clampOffset(n: number): number {
  return n < 0 ? 0 : n;
}

function makeKey(q: string, limit: number, offset: number): string {
  return `q=${q.trim()}|limit=${limit}|offset=${offset}`;
}

export const usePatientsStore = create<Store>((set, get) => ({
  q: "",
  limit: 25,
  offset: 0,

  rows: [],
  count: 0,
  loading: false,
  error: null,
  lastFetchedAt: null,
  lastKey: null,

  setQuery: (v) => set({ q: v, offset: 0 }),
  setLimit: (n) => set({ limit: n, offset: 0 }),
  setOffset: (n) => set({ offset: clampOffset(n) }),

  refresh: async () => {
    const s = get();
    const query = s.q.trim();

    // The backend /patients/search endpoint requires a non-empty `q`
    // (q: z.string().min(1)) and builds its WHERE clause as `ILIKE '%<q>%'`
    // without escaping wildcards. So when there's no search term we send a
    // lone "%" — the pattern becomes "%%%", which matches every patient and
    // lets us list everyone on load with no backend change.
    const effectiveQuery = query.length > 0 ? query : MATCH_ALL_QUERY;
    const key = makeKey(effectiveQuery, s.limit, s.offset);

    if (s.lastFetchedAt && s.lastKey === key && Date.now() - s.lastFetchedAt < CACHE_TTL_MS) {
      return;
    }

    // Stale-while-refresh: keep existing rows
    set({ loading: true, error: null });
    try {
      const res = await searchPatients({
        q: effectiveQuery,
        limit: s.limit,
        offset: s.offset,
      });
      set({
        rows: res.data,
        count: res.count,
        loading: false,
        error: null,
        lastFetchedAt: Date.now(),
        lastKey: key,
      });
    } catch (e: unknown) {
      // Keep existing rows/count
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
}));
