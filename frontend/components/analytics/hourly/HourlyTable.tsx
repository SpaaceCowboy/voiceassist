// Path: components/analytics/hourly/HourlyTable.tsx
import { ChartCard, HourBars } from "@/components/ui/charts";
import { toNum } from "@/lib/format";
import type { HourlyAnalytics } from "@/lib/types";

export function HourlyTable({ rows }: { rows: HourlyAnalytics[] }) {
  // Backend returns { hour, call_count }; tolerate a legacy `calls` field too.
  const data = rows.map((r) => ({
    hour: toNum(r.hour) ?? 0,
    value: toNum(r.call_count) ?? toNum(r.calls) ?? 0,
  }));

  return (
    <ChartCard title="Hourly distribution" subtitle="Call volume by hour of day">
      <HourBars data={data} valueFormat={(v) => `${v} call${v === 1 ? "" : "s"}`} />
    </ChartCard>
  );
}
