// Path: components/sessions/stats/SessionsStatsCards.tsx
import { KpiCard, SERIES_COLORS } from "@/components/ui/charts";
import { UsersIcon, BoltIcon, ClockIcon, CheckCircleIcon } from "@/components/ui/icons";
import type { SessionStats } from "@/lib/types";

function pickNum(o: Record<string, unknown>, key: string): number | null {
  const v = o[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function fmtNum(n: number | null): string {
  return n == null ? "—" : n.toLocaleString();
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
      <div
        className="rounded-2xl border p-4 text-sm"
        style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
      >
        No session stats available.
      </div>
    );
  }

  const o = stats as unknown as Record<string, unknown>;
  const total = pickNum(o, "total");
  const active = pickNum(o, "active");
  const inactive = pickNum(o, "inactive");
  const oldestInactive = o["oldestInactive"];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiCard label="Total sessions" value={fmtNum(total)} icon={<UsersIcon />} color={SERIES_COLORS[1]} />
      <KpiCard label="Active sessions" value={fmtNum(active)} icon={<BoltIcon />} color={SERIES_COLORS[2]} />
      <KpiCard
        label="Inactive sessions"
        value={fmtNum(inactive)}
        icon={<CheckCircleIcon />}
        color={SERIES_COLORS[0]}
      />
      <KpiCard
        label="Oldest inactive"
        value={<span className="text-base">{fmtDate(oldestInactive)}</span>}
        icon={<ClockIcon />}
        color={SERIES_COLORS[5]}
      />
    </div>
  );
}
