// Path: store/analytics.ts
import { create } from "zustand";
import {
  getAnalyticsOverview,
  getIntentAnalytics,
  getHourlyAnalytics,
  getAnalyticsMetrics,
  type DateRange,
} from "@/lib/api/voiceAssistantApi";
import type {
  IntentAnalytics,
  HourlyAnalytics,
  AnalyticsOverviewFull,
  AggregateMetrics,
} from "@/lib/types";

export type RangePreset = "7d" | "30d" | "90d" | "custom";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

type Store = {
  overview: AnalyticsOverviewFull | null;
  intents: IntentAnalytics[];
  hourly: HourlyAnalytics[];
  metrics: AggregateMetrics | null;

  preset: RangePreset;
  startDate: string;
  endDate: string;

  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  setPreset: (p: RangePreset) => void;
  setCustomRange: (start: string, end: string) => void;
  refresh: () => Promise<void>;
};

const PRESET_DAYS: Record<Exclude<RangePreset, "custom">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export const useAnalyticsStore = create<Store>((set, get) => ({
  overview: null,
  intents: [],
  hourly: [],
  metrics: null,

  preset: "30d",
  startDate: isoDaysAgo(30),
  endDate: todayIso(),

  loading: false,
  error: null,
  lastFetchedAt: null,

  setPreset: (p) => {
    if (p === "custom") {
      set({ preset: p });
      return;
    }
    set({ preset: p, startDate: isoDaysAgo(PRESET_DAYS[p]), endDate: todayIso() });
    void get().refresh();
  },

  setCustomRange: (start, end) => {
    set({ preset: "custom", startDate: start, endDate: end });
    void get().refresh();
  },

  refresh: async () => {
    const { startDate, endDate } = get();
    const range: DateRange = { start_date: startDate, end_date: endDate };
    set({ loading: true, error: null });
    try {
      const [o, i, h, m] = await Promise.all([
        getAnalyticsOverview(range),
        getIntentAnalytics(range),
        getHourlyAnalytics(range),
        // Metrics are best-effort: older calls may lack the metrics column.
        getAnalyticsMetrics(range).catch(() => null),
      ]);

      set({
        overview: (o.data as unknown as AnalyticsOverviewFull) ?? null,
        intents: i.data ?? [],
        hourly: h.data ?? [],
        metrics: m?.data ?? null,
        loading: false,
        error: null,
        lastFetchedAt: Date.now(),
      });
    } catch (e: unknown) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
        overview: null,
        intents: [],
        hourly: [],
        metrics: null,
      });
    }
  },
}));
