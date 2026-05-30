// Path: components/analytics/AnalyticsPageClient.tsx
"use client";

import { useEffect } from "react";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { SkeletonText, SkeletonTable } from "@/components/ui/Skeleton";
import { useAnalyticsStore } from "@/store/analytics";
import { OverviewCards } from "./overview/OverviewCards";
import { IntentsTable } from "./intents/IntentsTable";
import { HourlyTable } from "./hourly/HourlyTable";
import { MetricsPanel } from "./metrics/MetricsPanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function AnalyticsPageClient() {
  const { overview, intents, hourly, metrics, loading, error, lastFetchedAt, refresh } =
    useAnalyticsStore();

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const period = overview?.period;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            {period?.start && period?.end
              ? `Calls, intents, and performance from ${period.start} to ${period.end}.`
              : "Overview, intent breakdown, hourly distribution, and call performance."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastFetchedAt ? (
            <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
              Updated {new Date(lastFetchedAt).toLocaleTimeString()}
            </span>
          ) : null}
          <Button variant="ghost" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {error ? <ErrorCard message={error} /> : null}

      {loading && !overview ? (
        <Card className="p-4">
          <SkeletonText lines={5} />
        </Card>
      ) : (
        <OverviewCards overview={overview} />
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {loading && intents.length === 0 ? (
          <SkeletonTable rows={6} />
        ) : (
          <IntentsTable rows={intents} />
        )}

        {loading && hourly.length === 0 ? (
          <SkeletonTable rows={6} />
        ) : (
          <HourlyTable rows={hourly} />
        )}
      </div>

      <MetricsPanel metrics={metrics} />
    </div>
  );
}
