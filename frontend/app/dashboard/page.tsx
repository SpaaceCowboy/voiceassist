"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { backendGet } from "@/lib/backend";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";

type Envelope<T> = { success?: boolean; data?: T } | T;

type OverviewData = {
  period?: { start?: string; end?: string };
  calls?: {
    total_calls?: string | number;
    completed_calls?: string | number;
    avg_duration?: string | number;
    transferred_calls?: string | number;
    calls_with_errors?: string | number;
  };
  appointments?: {
    total?: string | number;
    scheduled?: string | number;
    confirmed?: string | number;
    completed?: string | number;
    cancelled?: string | number;
  };
};

type IntentRow = { intent?: string; count?: string | number; percentage?: string | number };
type HourlyRow = { hour?: string | number; call_count?: string | number };

function unwrap<T>(res: Envelope<T>): T {
  return (res as { data?: T })?.data ?? (res as T);
}

function StatCard({ label, value }: { label: string; value: unknown }) {
  return (
    <Card className="p-4">
      <div className="text-xs mb-1" style={{ color: "rgb(var(--muted))" }}>
        {label}
      </div>
      <div className="text-2xl font-semibold">{String(value ?? "—")}</div>
    </Card>
  );
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewData>({});
  const [intents, setIntents] = useState<IntentRow[]>([]);
  const [hourly, setHourly] = useState<HourlyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [o, i, h] = await Promise.all([
        backendGet<Envelope<OverviewData>>("/api/analytics/overview").catch(
          () => ({}) as Envelope<OverviewData>,
        ),
        backendGet<Envelope<IntentRow[]>>("/api/analytics/intents").catch(
          () => ({ data: [] }) as Envelope<IntentRow[]>,
        ),
        backendGet<Envelope<HourlyRow[]>>("/api/analytics/hourly").catch(
          () => ({ data: [] }) as Envelope<HourlyRow[]>,
        ),
      ]);
      if (cancelled) return;
      setOverview(unwrap(o) ?? {});
      setIntents(unwrap(i) ?? []);
      setHourly(unwrap(h) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const c = overview.calls ?? {};
  const a = overview.appointments ?? {};
  const period = overview.period;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Dashboard"
          subtitle={
            period?.start && period?.end
              ? `Snapshot ${period.start} → ${period.end}`
              : "Live snapshot from backend analytics."
          }
        />
      </Card>

      <GlobalSearch />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Calls" value={loading ? "…" : c.total_calls} />
        <StatCard
          label="Appointments"
          value={loading ? "…" : a.total}
        />
        <StatCard
          label="Transfers"
          value={loading ? "…" : c.transferred_calls}
        />
        <StatCard
          label="Errors"
          value={loading ? "…" : c.calls_with_errors}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="font-semibold">Top Intents</div>
          <div className="mt-3 space-y-2 text-sm">
            {intents.slice(0, 8).map((row, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{String(row.intent ?? "—")}</span>
                <span style={{ color: "rgb(var(--muted))" }}>
                  {String(row.count ?? "—")}
                  {row.percentage != null ? ` (${row.percentage}%)` : ""}
                </span>
              </div>
            ))}
            {!loading && intents.length === 0 && (
              <div style={{ color: "rgb(var(--muted))" }}>No intent data.</div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="font-semibold">Busy Hours</div>
          <div className="mt-3 space-y-2 text-sm">
            {hourly.slice(0, 8).map((row, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{`${row.hour ?? "—"}:00`}</span>
                <span style={{ color: "rgb(var(--muted))" }}>
                  {String(row.call_count ?? "—")}
                </span>
              </div>
            ))}
            {!loading && hourly.length === 0 && (
              <div style={{ color: "rgb(var(--muted))" }}>No hourly data.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
