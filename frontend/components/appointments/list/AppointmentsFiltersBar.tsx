// Path: components/appointments/list/AppointmentsFiltersBar.tsx
"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  APPOINTMENT_STATUSES,
  type AppointmentStatusFilter,
  type DateScope,
} from "../types/appointments";

type Props = {
  scope: DateScope;
  setScope: (v: DateScope) => void;

  date: string;
  setDate: (v: string) => void;

  status: AppointmentStatusFilter;
  setStatus: (v: AppointmentStatusFilter) => void;

  q: string;
  setQ: (v: string) => void;

  limit: number;
  setLimit: (v: number) => void;

  onRefresh: () => void;

  showing: number;
  total: number;
  offset: number;

  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function AppointmentsFiltersBar(p: Props) {
  return (
    <Card className="p-3 flex flex-wrap gap-2 items-center">
      {/* Scope */}
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          Scope
        </span>
        <select
          value={p.scope}
          onChange={(e) => p.setScope(e.target.value as DateScope)}
          className="px-3 py-2 rounded-xl border text-sm"
          style={{
            background: "rgb(var(--surface2))",
            borderColor: "rgb(var(--border))",
            color: "rgb(var(--text))",
          }}
        >
          <option value="today">Today</option>
          <option value="date">Pick a date</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Date (only active in scope=date) */}
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          Date
        </span>
        <input
          type="date"
          value={p.date}
          onChange={(e) => p.setDate(e.target.value)}
          disabled={p.scope !== "date"}
          className="px-3 py-2 rounded-xl border text-sm"
          style={{
            background: "rgb(var(--surface2))",
            borderColor: "rgb(var(--border))",
            color: "rgb(var(--text))",
            opacity: p.scope !== "date" ? 0.6 : 1,
          }}
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          Status
        </span>
        <select
          value={p.status}
          onChange={(e) => p.setStatus(e.target.value as AppointmentStatusFilter)}
          className="px-3 py-2 rounded-xl border text-sm"
          style={{
            background: "rgb(var(--surface2))",
            borderColor: "rgb(var(--border))",
            color: "rgb(var(--text))",
          }}
        >
          <option value="">All</option>
          {APPOINTMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <Input value={p.q} onChange={p.setQ} placeholder="Search appointments…" className="w-72" />

      {/* Limit */}
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          Limit
        </span>
        <select
          value={String(p.limit)}
          onChange={(e) => p.setLimit(Number(e.target.value))}
          className="px-3 py-2 rounded-xl border text-sm"
          style={{
            background: "rgb(var(--surface2))",
            borderColor: "rgb(var(--border))",
            color: "rgb(var(--text))",
          }}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={String(n)}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <Button variant="ghost" onClick={p.onRefresh}>Refresh</Button>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" onClick={p.onPrev} disabled={!p.hasPrev}>Prev</Button>
        <Button variant="ghost" onClick={p.onNext} disabled={!p.hasNext}>Next</Button>
        <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          Showing {p.showing}/{p.total} • offset {p.offset}
        </div>
      </div>
    </Card>
  );
}