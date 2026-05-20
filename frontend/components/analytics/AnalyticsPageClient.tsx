// Path: components/analytics/AnalyticsPageClient.tsx
"use client";

import { useEffect } from "react";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { SkeletonText, SkeletonTable } from "@/components/ui/Skeleton";
import { useAnalyticsStore } from "@/store/analytics";
import { OverviewCards } from "./overview/OverviewCards";
import { IntentsTable } from "./intents/IntentsTable";
import { HourlyTable } from "./hourly/HourlyTable";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function AnalyticsPageClient() {
  const { overview, intents, hourly, loading, error, refresh } =
    useAnalyticsStore();

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Analytics</h1>
          <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            Overview, intent breakdown, and hourly distribution.
          </p>
        </div>

        <Button variant="ghost" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error ? <ErrorCard message={error} /> : null}

      {loading && !overview ? (
        <Card className="p-4">
          <SkeletonText lines={5} />
        </Card>
      ) : (
        <OverviewCards overview={overview} />
      )}

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
  );
}