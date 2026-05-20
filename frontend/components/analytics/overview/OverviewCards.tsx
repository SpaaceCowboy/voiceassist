// Path: components/analytics/overview/OverviewCards.tsx
import { Card } from "@/components/ui/Card";
import type { IntentAnalytics } from "@/lib/types";

export function OverviewCards({ overview }: { overview: IntentAnalytics | null }) {
  if (!overview) {
    return (
      <Card className="p-4">
        <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          No overview data.
        </div>
      </Card>
    );
  }

  // Depending on backend schema, overview may include fields like totals.
  const o = overview as unknown as Record<string, unknown>;

  function n(key: string): string {
    const v = o[key];
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && v.trim()) return v.trim();
    return "—";
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="p-4">
        <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>Total calls</div>
        <div className="text-2xl font-semibold">{n("total_calls")}</div>
      </Card>
      <Card className="p-4">
        <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>Total appointments</div>
        <div className="text-2xl font-semibold">{n("total_appointments")}</div>
      </Card>
      <Card className="p-4">
        <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>Transfers</div>
        <div className="text-2xl font-semibold">{n("transfers")}</div>
      </Card>
      <Card className="p-4">
        <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>Failures</div>
        <div className="text-2xl font-semibold">{n("failures")}</div>
      </Card>
    </div>
  );
}