// Path: components/sessions/stats/SessionsStatsCards.tsx
import { Card } from "@/components/ui/Card";
import type { SessionStats } from "@/lib/types";

function pickNum(o: Record<string, unknown>, key: string): number | null {
  const v = o[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function fmtNum(n: number | null): string {
  return n == null ? "—" : String(n); // ✅ shows 0 correctly
}

function fmtDate(v: unknown): string {
  if (typeof v !== "string" || !v.trim()) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

export function SessionsStatsCards({ stats }: { stats: SessionStats | null }) {
  if (!stats) {
    return (
      <Card className="p-4">
        <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          No session stats available.
        </div>
      </Card>
    );
  }

  const o = stats as unknown as Record<string, unknown>;

  // ✅ Your backend keys:
  const total = pickNum(o, "total");
  const active = pickNum(o, "active");
  const inactive = pickNum(o, "inactive");
  const oldestInactive = o["oldestInactive"];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="p-4">
        <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          Total sessions
        </div>
        <div className="text-2xl font-semibold">{fmtNum(total)}</div>
      </Card>

      <Card className="p-4">
        <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          Active sessions
        </div>
        <div className="text-2xl font-semibold">{fmtNum(active)}</div>
      </Card>

      <Card className="p-4">
        <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          Inactive sessions
        </div>
        <div className="text-2xl font-semibold">{fmtNum(inactive)}</div>
      </Card>

      <Card className="p-4">
        <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          Oldest inactive
        </div>
        <div className="text-sm font-medium">{fmtDate(oldestInactive)}</div>
      </Card>
    </div>
  );
}