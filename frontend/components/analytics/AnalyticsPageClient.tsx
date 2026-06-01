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
import { PageHeader } from "@/components/ui/PageHeader";
import { ChartIcon, RefreshIcon } from "@/components/ui/icons";

const PRESETS: { key: "7d" | "30d" | "90d"; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

export default function AnalyticsPageClient() {
  const {
    overview, intents, hourly, metrics, loading, error, lastFetchedAt, refresh,
    preset, startDate, endDate, setPreset, setCustomRange,
  } = useAnalyticsStore();

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const period = overview?.period;

  const rangeSelector = (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className="flex items-center gap-0.5 rounded-xl border p-0.5"
        style={{ background: "rgb(var(--surface2))", borderColor: "rgb(var(--border))" }}
      >
        {PRESETS.map((p) => {
          const active = preset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPreset(p.key)}
              className="rounded-lg px-2.5 py-1 text-xs font-medium transition"
              style={
                active
                  ? { background: "rgb(var(--surface))", color: "rgb(var(--text))", boxShadow: "var(--shadow-sm)" }
                  : { color: "rgb(var(--muted))" }
              }
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
        <input
          type="date"
          value={startDate}
          max={endDate}
          onChange={(e) => setCustomRange(e.target.value, endDate)}
          className="rounded-lg border px-2 py-1"
          style={{ background: "rgb(var(--surface2))", borderColor: "rgb(var(--border))", color: "rgb(var(--text))" }}
        />
        <span>→</span>
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => setCustomRange(startDate, e.target.value)}
          className="rounded-lg border px-2 py-1"
          style={{ background: "rgb(var(--surface2))", borderColor: "rgb(var(--border))", color: "rgb(var(--text))" }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<ChartIcon />}
        title="Analytics"
        subtitle={
          period?.start && period?.end
            ? `Calls, intents, and performance from ${period.start} to ${period.end}.`
            : "Overview, intent breakdown, hourly distribution, and call performance."
        }
        actions={
          <>
            {rangeSelector}
            {lastFetchedAt ? (
              <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                Updated {new Date(lastFetchedAt).toLocaleTimeString()}
              </span>
            ) : null}
            <Button variant="outline" icon={<RefreshIcon size={16} />} onClick={refresh} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
          </>
        }
      />

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
