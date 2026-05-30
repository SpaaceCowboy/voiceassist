// Path: components/analytics/intents/IntentsTable.tsx
import { ChartCard, BarList } from "@/components/ui/charts";
import { toNum, fmtPercent, humanize } from "@/lib/format";
import type { IntentAnalytics } from "@/lib/types";

export function IntentsTable({ rows }: { rows: IntentAnalytics[] }) {
  const items = rows
    .map((r) => ({
      label: humanize(r.intent),
      value: toNum(r.count) ?? 0,
      pct: toNum(r.percentage),
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((r) => ({
      label: r.label,
      value: r.value,
      hint: `${r.value.toLocaleString()}${r.pct != null ? ` · ${fmtPercent(r.pct)}` : ""}`,
    }));

  return (
    <ChartCard title="Intent breakdown" subtitle="Detected caller intent across the period">
      <BarList items={items} colorful emptyText="No intent data for this range." />
    </ChartCard>
  );
}
