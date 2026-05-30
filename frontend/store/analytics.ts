// Path: store/analytics.ts
import { create } from "zustand";
import {
  getAnalyticsOverview,
  getIntentAnalytics,
  getHourlyAnalytics,
  getAnalyticsMetrics,
} from "@/lib/api/voiceAssistantApi";
import type {
  IntentAnalytics,
  HourlyAnalytics,
  AnalyticsOverviewFull,
  AggregateMetrics,
} from "@/lib/types";

type Store = {
  overview: AnalyticsOverviewFull | null;
  intents: IntentAnalytics[];
  hourly: HourlyAnalytics[];
  metrics: AggregateMetrics | null;

  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  refresh: () => Promise<void>;
};

export const useAnalyticsStore = create<Store>((set) => ({
  overview: null,
  intents: [],
  hourly: [],
  metrics: null,

  loading: false,
  error: null,
  lastFetchedAt: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const [o, i, h, m] = await Promise.all([
        getAnalyticsOverview(),
        getIntentAnalytics(),
        getHourlyAnalytics(),
        // Metrics are best-effort: older calls may lack the metrics column.
        getAnalyticsMetrics().catch(() => null),
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
