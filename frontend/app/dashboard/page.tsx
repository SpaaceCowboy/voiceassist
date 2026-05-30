"use client";

import { useEffect, useState } from "react";
import { backendGet } from "@/lib/backend";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import {
  KpiCard,
  ChartCard,
  BarList,
  HourBars,
  Donut,
  StatRing,
  SERIES_COLORS,
  type DonutSegment,
} from "@/components/ui/charts";
import {
  PhoneIcon,
  CalendarIcon,
  TransferIcon,
  AlertIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
import { toNum, fmtInt, fmtDuration, fmtPercent, humanize } from "@/lib/format";

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
    no_shows?: string | number;
    from_ai?: string | number;
  };
};

type IntentRow = { intent?: string; count?: string | number; percentage?: string | number };
type HourlyRow = { hour?: string | number; call_count?: string | number };

function unwrap<T>(res: Envelope<T>): T {
  return (res as { data?: T })?.data ?? (res as T);
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

  const totalCalls = toNum(c.total_calls) ?? 0;
  const completedCalls = toNum(c.completed_calls) ?? 0;
  const transfers = toNum(c.transferred_calls) ?? 0;
  const errors = toNum(c.calls_with_errors) ?? 0;
  const completionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;

  const intentItems = intents
    .map((r) => ({ label: humanize(r.intent), value: toNum(r.count) ?? 0, pct: toNum(r.percentage) }))
    .filter((r) => r.value > 0)
    .slice(0, 7)
    .map((r) => ({
      label: r.label,
      value: r.value,
      hint: `${r.value.toLocaleString()}${r.pct != null ? ` · ${fmtPercent(r.pct)}` : ""}`,
    }));

  const hourData = hourly.map((r) => ({
    hour: toNum(r.hour) ?? 0,
    value: toNum(r.call_count) ?? 0,
  }));

  // Appointment status composition
  const apptSegments: DonutSegment[] = [
    { label: "Scheduled", value: toNum(a.scheduled) ?? 0, color: SERIES_COLORS[1] },
    { label: "Confirmed", value: toNum(a.confirmed) ?? 0, color: SERIES_COLORS[0] },
    { label: "Completed", value: toNum(a.completed) ?? 0, color: SERIES_COLORS[2] },
    { label: "Cancelled", value: toNum(a.cancelled) ?? 0, color: SERIES_COLORS[4] },
    { label: "No-show", value: toNum(a.no_shows) ?? 0, color: SERIES_COLORS[3] },
  ].filter((s) => s.value > 0);
  const apptTotal = toNum(a.total) ?? apptSegments.reduce((s, x) => s + x.value, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            {period?.start && period?.end
              ? `Activity from ${period.start} to ${period.end}`
              : "Live snapshot from backend analytics."}
          </p>
        </div>
        {!loading && (
          <span
            className="rounded-full border px-3 py-1 text-xs"
            style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
          >
            {fmtInt(totalCalls)} calls · {fmtInt(apptTotal)} appointments
          </span>
        )}
      </div>

      <GlobalSearch />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total calls"
          value={fmtInt(c.total_calls)}
          sub={`${fmtInt(completedCalls)} completed`}
          icon={<PhoneIcon />}
          color={SERIES_COLORS[0]}
          loading={loading}
        />
        <KpiCard
          label="Appointments"
          value={fmtInt(a.total)}
          sub={`${fmtInt(a.from_ai)} booked by AI`}
          icon={<CalendarIcon />}
          color={SERIES_COLORS[1]}
          loading={loading}
        />
        <KpiCard
          label="Transfers"
          value={fmtInt(c.transferred_calls)}
          sub={totalCalls > 0 ? `${fmtPercent((transfers / totalCalls) * 100)} of calls` : undefined}
          icon={<TransferIcon />}
          color={SERIES_COLORS[3]}
          loading={loading}
        />
        <KpiCard
          label="Errors"
          value={fmtInt(c.calls_with_errors)}
          sub={errors === 0 ? "All clear" : "Needs attention"}
          icon={<AlertIcon />}
          color={errors > 0 ? SERIES_COLORS[4] : SERIES_COLORS[2]}
          loading={loading}
        />
      </div>

      {/* Secondary row: completion ring + avg duration */}
      <div className="grid gap-3 lg:grid-cols-3">
        <ChartCard title="Call completion" subtitle="Completed vs. total handled">
          <div className="flex items-center justify-around py-1">
            <StatRing
              percent={completionRate}
              caption="completed"
              color={SERIES_COLORS[2]}
            />
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-2xl font-semibold tabular-nums">{fmtInt(completedCalls)}</div>
                <div style={{ color: "rgb(var(--muted))" }}>completed calls</div>
              </div>
              <div>
                <div className="text-lg font-semibold tabular-nums">{fmtDuration(c.avg_duration)}</div>
                <div style={{ color: "rgb(var(--muted))" }}>avg. duration</div>
              </div>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="Appointment status"
          subtitle="Where the schedule stands"
          className="lg:col-span-2"
        >
          {apptSegments.length ? (
            <Donut
              segments={apptSegments}
              centerLabel={{ value: fmtInt(apptTotal), caption: "total" }}
            />
          ) : (
            <div className="py-8 text-center text-sm" style={{ color: "rgb(var(--muted))" }}>
              No appointments in this window.
            </div>
          )}
        </ChartCard>
      </div>

      {/* Charts row */}
      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard
          title="Top intents"
          subtitle="What callers are asking for"
          right={<CheckCircleIcon size={18} className="opacity-50" />}
        >
          <BarList items={intentItems} colorful emptyText="No intent data yet." />
        </ChartCard>

        <ChartCard
          title="Busy hours"
          subtitle="Call volume by hour of day"
          right={<ClockIcon size={18} className="opacity-50" />}
        >
          <HourBars data={hourData} valueFormat={(v) => `${v} call${v === 1 ? "" : "s"}`} />
        </ChartCard>
      </div>
    </div>
  );
}
