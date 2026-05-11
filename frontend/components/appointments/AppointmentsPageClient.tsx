"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { getAppointments } from "@/lib/api/voiceAssistantApi";
import type { Appointment } from "@/lib/types";

const STATUS_OPTIONS = [
  "", // all
  "scheduled",
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
  "rescheduled",
] as const;

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes("cancel")) return "bad";
  if (s.includes("complete")) return "good";
  if (s.includes("no_show")) return "warn";
  if (s.includes("checked") || s.includes("progress") || s.includes("confirm"))
    return "accent";
  return "neutral";
}

function Pill({ value }: { value: string }) {
  const tone = statusTone(value);
  const cls =
    tone === "bad"
      ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200"
      : tone === "good"
        ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-200"
        : tone === "warn"
          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
          : tone === "accent"
            ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200"
            : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200";

  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${cls}`}>
      {value || "—"}
    </span>
  );
}

// You can tighten these fields once you confirm the exact backend schema
function pickId(a: Appointment): string {
  return String((a as unknown as { id?: string }).id ?? "");
}
function pickStatus(a: Appointment): string {
  return String((a as unknown as { status?: string }).status ?? "—");
}
function pickDateTime(a: Appointment): string {
  const x = a as unknown as {
    date?: string;
    time?: string;
    datetime?: string;
    start_time?: string;
  };
  return String(
    (x.datetime ?? x.start_time ?? `${x.date ?? ""} ${x.time ?? ""}`.trim()) ||
      "—",
  );
}
function pickPatientName(a: Appointment): string {
  const x = a as unknown as {
    patient_name?: string;
    full_name?: string;
    name?: string;
  };
  return String(x.patient_name ?? x.full_name ?? x.name ?? "—");
}
function pickDepartment(a: Appointment): string {
  const x = a as unknown as { department?: string; specialty?: string };
  return String(x.department ?? x.specialty ?? "—");
}
function pickProvider(a: Appointment): string {
  const x = a as unknown as {
    doctor?: string;
    provider?: string;
    provider_name?: string;
  };
  return String(x.doctor ?? x.provider_name ?? x.provider ?? "—");
}

export default function AppointmentsPageClient() {
  const [date, setDate] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [q, setQ] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<Appointment[]>([]);
  const [count, setCount] = useState<number>(0);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await getAppointments({
        date: date || undefined,
        status: status || undefined,
        limit: 50,
        offset: 0,
      });
      setRows(res.data);
      setCount(res.count);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
      setRows([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, status]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((a) => {
      const hay = [
        pickId(a),
        pickStatus(a),
        pickDateTime(a),
        pickPatientName(a),
        pickDepartment(a),
        pickProvider(a),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(t);
    });
  }, [q, rows]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Appointments</h1>
        <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          List appointments by date. Filters map to backend query params.
        </p>
      </div>

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl border text-sm"
            style={{
              background: "rgb(var(--surface2))",
              borderColor: "rgb(var(--border))",
              color: "rgb(var(--text))",
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Status
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border text-sm"
            style={{
              background: "rgb(var(--surface2))",
              borderColor: "rgb(var(--border))",
              color: "rgb(var(--text))",
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "" ? "All" : s}
              </option>
            ))}
          </select>
        </div>

        <Input
          value={q}
          onChange={setQ}
          placeholder="Search appointments…"
          className="w-72"
        />

        <Button variant="ghost" onClick={load}>
          Refresh
        </Button>

        <div className="text-xs ml-auto" style={{ color: "rgb(var(--muted))" }}>
          Showing {filtered.length}/{rows.length} • total {count}
        </div>
      </Card>

      {err ? (
        <Card className="p-3 border-[rgba(239,68,68,0.35)]">
          <div className="text-sm" style={{ color: "rgb(239,68,68)" }}>
            {err}
          </div>
        </Card>
      ) : null}

      {loading ? (
        <SkeletonTable rows={7} />
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "rgb(var(--surface))",
            borderColor: "rgb(var(--border))",
          }}
        >
          <table className="w-full text-sm">
            <thead style={{ background: "rgb(var(--surface2))" }}>
              <tr>
                <th className="text-left p-3">Date/Time</th>
                <th className="text-left p-3">Patient</th>
                <th className="text-left p-3">Department</th>
                <th className="text-left p-3">Provider</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const id = pickId(a);
                return (
                  <tr
                    key={id}
                    className="border-t border-black/5 dark:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <td className="p-3">
                      <Link
                        className="underline underline-offset-2"
                        href={`/appointments/${id}`}
                      >
                        {pickDateTime(a)}
                      </Link>
                    </td>
                    <td className="p-3">{pickPatientName(a)}</td>
                    <td className="p-3">{pickDepartment(a)}</td>
                    <td className="p-3">{pickProvider(a)}</td>
                    <td className="p-3">
                      <Pill value={pickStatus(a)} />
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-sm"
                    style={{ color: "rgb(var(--muted))" }}
                  >
                    No appointments found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
