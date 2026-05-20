// Path: store/calls.ts
import { create } from "zustand";
import { backendGet, BackendError } from "@/lib/backend";

export type CallLike = Record<string, unknown>;

type ListEnvelope =
  | { success?: boolean; data?: CallLike[]; count?: number }
  | CallLike[];

type Store = {
  q: string;
  limit: number;
  offset: number;

  rows: CallLike[];
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

function clampOffset(n: number): number {
  return n < 0 ? 0 : n;
}

function toStringErr(e: unknown): string {
  if (e instanceof BackendError) return `Failed (${e.status})`;
  if (e instanceof Error) return e.message;
  return String(e);
}

function makeKey(limit: number, offset: number): string {
  return `limit=${limit}|offset=${offset}`;
}

export const useCallsStore = create<Store>((set, get) => ({
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
    const key = makeKey(s.limit, s.offset);

    // Light caching
    if (s.lastFetchedAt && s.lastKey === key && Date.now() - s.lastFetchedAt < CACHE_TTL_MS) {
      return;
    }

    // Stale-while-refresh: keep existing rows
    set({ loading: true, error: null });

    try {
      const data = await backendGet<ListEnvelope>(
        `/api/calls?limit=${s.limit}&offset=${s.offset}`,
      );

      const list = Array.isArray(data) ? data : data.data ?? [];
      const count = Array.isArray(data) ? list.length : data.count ?? list.length;

      set({
        rows: list,
        count,
        loading: false,
        error: null,
        lastFetchedAt: Date.now(),
        lastKey: key,
      });
    } catch (e: unknown) {
      // Keep existing rows/count
      set({
        loading: false,
        error: toStringErr(e),
      });
    }
  },
}));
