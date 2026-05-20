// Path: store/analytics.ts
import { create } from "zustand";
import {
  getAnalyticsOverview,
  getIntentAnalytics,
  getHourlyAnalytics,
} from "@/lib/api/voiceAssistantApi";
import type { IntentAnalytics, HourlyAnalytics } from "@/lib/types";

type Overview = IntentAnalytics; // your api returns IntentAnalytics type for overview wrapper

type Store = {
  overview: Overview | null;
  intents: IntentAnalytics[];
  hourly: HourlyAnalytics[];

  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  refresh: () => Promise<void>;
};

export const useAnalyticsStore = create<Store>((set) => ({
  overview: null,
  intents: [],
  hourly: [],

  loading: false,
  error: null,
  lastFetchedAt: null,

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const [o, i, h] = await Promise.all([
        getAnalyticsOverview(),
        getIntentAnalytics(),
        getHourlyAnalytics(),
      ]);

      set({
        overview: o.data,
        intents: i.data,
        hourly: h.data,
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
      });
    }
  },
}));