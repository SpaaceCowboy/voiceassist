"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { backendGet } from "@/lib/backend";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { KpiCard, SERIES_COLORS } from "@/components/ui/charts";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  HomeIcon,
  PhoneIcon,
  CalendarIcon,
  TransferIcon,
  AlertIcon,
  HeartPulseIcon,
  ChartIcon,
  HelpIcon,
  LayersIcon,
  ActivityIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { toNum, fmtInt, fmtPercent } from "@/lib/format";
import { todayISO } from "@/lib/appointments";

type Envelope<T> = { success?: boolean; data?: T; count?: number } | T;
type AnyObj = Record<string, unknown>;

function unwrap<T>(res: Envelope<T>): T {
  return (res as { data?: T })?.data ?? (res as T);
}
function s(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}
function pick(o: AnyObj, keys: string[]): string {
  for (const k of keys) {
    const v = s(o[k]);
    if (v) return v;
  }
  return "";
}
function fmtClock(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 5);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

type OverviewData = {
  calls?: { total_calls?: string | number; completed_calls?: string | number; transferred_calls?: string | number; calls_with_errors?: string | number };
  appointments?: { total?: string | number; from_ai?: string | number };
};

const SECTIONS = [
  { href: "/appointments", label: "Appointments", desc: "Browse & update bookings", Icon: CalendarIcon },
  { href: "/patients", label: "Patients", desc: "Profiles & history", Icon: HeartPulseIcon },
  { href: "/calls", label: "Calls", desc: "Logs & transcripts", Icon: PhoneIcon },
  { href: "/analytics", label: "Analytics", desc: "Trends & performance", Icon: ChartIcon },
  { href: "/faqs", label: "FAQs", desc: "Assistant knowledge base", Icon: HelpIcon },
  { href: "/sessions", label: "Sessions", desc: "Live sessions & cleanup", Icon: LayersIcon },
  { href: "/status", label: "API Status", desc: "Endpoint health", Icon: ActivityIcon },
  { href: "/users", label: "Users", desc: "Members & access", Icon: UsersIcon },
] as const;

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewData>({});
  const [recentCalls, setRecentCalls] = useState<AnyObj[]>([]);
  const [todayAppts, setTodayAppts] = useState<AnyObj[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [o, c, a] = await Promise.all([
        backendGet<Envelope<OverviewData>>("/api/analytics/overview").catch(() => ({}) as Envelope<OverviewData>),
        backendGet<Envelope<AnyObj[]>>("/api/calls?limit=6&offset=0").catch(() => ({ data: [] }) as Envelope<AnyObj[]>),
        backendGet<Envelope<AnyObj[]>>(`/api/appointments?date=${todayISO()}&limit=6`).catch(() => ({ data: [] }) as Envelope<AnyObj[]>),
      ]);
      if (cancelled) return;
      setOverview(unwrap(o) ?? {});
      setRecentCalls((unwrap(c) as AnyObj[]) ?? []);
      setTodayAppts((unwrap(a) as AnyObj[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const c = overview.calls ?? {};
  const a = overview.appointments ?? {};
  const totalCalls = toNum(c.total_calls) ?? 0;
  const transfers = toNum(c.transferred_calls) ?? 0;
  const errors = toNum(c.calls_with_errors) ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<HomeIcon />}
        title="Dashboard"
        subtitle="Search anything, jump to any section, and see what's happening right now."
        actions={
          <Link
            href="/analytics"
            className="inline-flex items-center gap-1 text-sm"
            style={{ color: "rgb(var(--accent))" }}
          >
            Full analytics →
          </Link>
        }
      />

      {/* Command search — the primary way to find anything */}
      <GlobalSearch />

      {/* At-a-glance pulse (numbers only; deep charts live on Analytics) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total calls" value={fmtInt(c.total_calls)} sub={`${fmtInt(c.completed_calls)} completed`} icon={<PhoneIcon />} color={SERIES_COLORS[0]} loading={loading} />
        <KpiCard label="Appointments" value={fmtInt(a.total)} sub={`${fmtInt(a.from_ai)} booked by AI`} icon={<CalendarIcon />} color={SERIES_COLORS[1]} loading={loading} />
        <KpiCard label="Transfers" value={fmtInt(c.transferred_calls)} sub={totalCalls > 0 ? `${fmtPercent((transfers / totalCalls) * 100)} of calls` : undefined} icon={<TransferIcon />} color={SERIES_COLORS[3]} loading={loading} />
        <KpiCard label="Errors" value={fmtInt(c.calls_with_errors)} sub={errors === 0 ? "All clear" : "Needs attention"} icon={<AlertIcon />} color={errors > 0 ? SERIES_COLORS[4] : SERIES_COLORS[2]} loading={loading} />
      </div>

      {/* Quick access to every section */}
      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: "rgb(var(--muted))" }}>
          Quick access
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {SECTIONS.map(({ href, label, desc, Icon }) => (
            <Link key={href} href={href} className="group">
              <Card className="flex h-full items-start gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition group-hover:scale-105"
                  style={{ background: "rgba(var(--accent),0.12)", color: "rgb(var(--accent))" }}
                >
                  <Icon size={20} />
                </span>
                <div className="min-w-0">
                  <div className="font-medium">{label}</div>
                  <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                    {desc}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid gap-3 lg:grid-cols-2">
        <RecentCard
          title="Today's appointments"
          href="/appointments"
          loading={loading}
          empty="No appointments scheduled today."
          rows={todayAppts.map((o, i) => {
            const id = pick(o, ["id", "appointment_id"]);
            return {
              key: id || pick(o, ["confirmation_code"]) || `appt-${i}`,
              href: id ? `/appointments/${id}` : "/appointments",
              left: pick(o, ["patient_name", "full_name"]) || "Unknown patient",
              sub: [pick(o, ["department_name", "department"]), pick(o, ["doctor_name", "provider_name", "provider"])].filter(Boolean).join(" · "),
              meta: fmtClock(pick(o, ["scheduled_time", "appointment_time"])),
              status: pick(o, ["status"]),
            };
          })}
        />
        <RecentCard
          title="Recent calls"
          href="/calls"
          loading={loading}
          empty="No calls logged yet."
          rows={recentCalls.map((o, i) => {
            const sid = pick(o, ["callSid", "call_sid", "sid", "id"]);
            return {
              key: sid || `call-${i}`,
              href: sid ? `/calls/${sid}` : "/calls",
              left: pick(o, ["patient_name"]) || (sid ? `Call ${sid.slice(0, 6)}` : "Call"),
              sub: pick(o, ["intent", "problem"]),
              meta: fmtClock(pick(o, ["created_at", "started_at", "timestamp"])),
              status: pick(o, ["outcome", "status"]),
            };
          })}
        />
      </div>
    </div>
  );
}

type RecentRow = { key: string; href: string; left: string; sub: string; meta: string; status: string };

function RecentCard({
  title,
  href,
  rows,
  loading,
  empty,
}: {
  title: string;
  href: string;
  rows: RecentRow[];
  loading: boolean;
  empty: string;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <Link href={href} className="text-xs" style={{ color: "rgb(var(--accent))" }}>
          View all →
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-black/5 dark:bg-white/10" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed py-8 text-center text-sm" style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}>
          {empty}
        </div>
      ) : (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <Link
              key={r.key}
              href={r.href}
              className="flex items-center gap-3 rounded-xl border p-2.5 transition hover:bg-[rgb(var(--surface2))]"
              style={{ borderColor: "rgb(var(--border))" }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.left}</div>
                {r.sub ? (
                  <div className="truncate text-xs" style={{ color: "rgb(var(--muted))" }}>
                    {r.sub}
                  </div>
                ) : null}
              </div>
              <div className="text-xs tabular-nums" style={{ color: "rgb(var(--muted))" }}>
                {r.meta}
              </div>
              {r.status ? <StatusPill value={r.status} size="sm" /> : null}
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
