// Path: components/analytics/overview/OverviewCards.tsx
import { KpiCard, SERIES_COLORS } from "@/components/ui/charts";
import {
  PhoneIcon,
  CalendarIcon,
  TransferIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
import { toNum, fmtInt, fmtDuration, fmtPercent } from "@/lib/format";
import type { AnalyticsOverviewFull } from "@/lib/types";

export function OverviewCards({ overview }: { overview: AnalyticsOverviewFull | null }) {
  if (!overview) {
    return (
      <div
        className="rounded-2xl border p-4 text-sm"
        style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
      >
        No overview data.
      </div>
    );
  }

  const c = overview.calls ?? {};
  const a = overview.appointments ?? {};

  const totalCalls = toNum(c.total_calls) ?? 0;
  const completed = toNum(c.completed_calls) ?? 0;
  const transfers = toNum(c.transferred_calls) ?? 0;
  const completionRate = totalCalls > 0 ? (completed / totalCalls) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <KpiCard
        label="Total calls"
        value={fmtInt(c.total_calls)}
        icon={<PhoneIcon />}
        color={SERIES_COLORS[0]}
      />
      <KpiCard
        label="Completion"
        value={fmtPercent(completionRate)}
        sub={`${fmtInt(completed)} completed`}
        icon={<CheckCircleIcon />}
        color={SERIES_COLORS[2]}
      />
      <KpiCard
        label="Avg duration"
        value={fmtDuration(c.avg_duration)}
        icon={<ClockIcon />}
        color={SERIES_COLORS[5]}
      />
      <KpiCard
        label="Transfers"
        value={fmtInt(c.transferred_calls)}
        sub={totalCalls > 0 ? `${fmtPercent((transfers / totalCalls) * 100)} of calls` : undefined}
        icon={<TransferIcon />}
        color={SERIES_COLORS[3]}
      />
      <KpiCard
        label="Appointments"
        value={fmtInt(a.total)}
        sub={`${fmtInt(a.from_ai)} by AI`}
        icon={<CalendarIcon />}
        color={SERIES_COLORS[1]}
      />
    </div>
  );
}
