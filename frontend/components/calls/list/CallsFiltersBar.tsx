// Path: components/calls/list/CallsFiltersBar.tsx
"use client";

import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const OUTCOMES = ["booked", "transferred", "faq_only", "completed", "failed"] as const;

const selectStyle = {
  background: "rgb(var(--surface2))",
  borderColor: "rgb(var(--border))",
  color: "rgb(var(--text))",
} as const;

type Props = {
  q: string;
  setQ: (v: string) => void;

  outcome: string;
  setOutcome: (v: string) => void;

  limit: number;
  setLimit: (n: number) => void;

  offset: number;
  hasPrev: boolean;
  hasNext: boolean;
  paused: boolean;

  onPrev: () => void;
  onNext: () => void;

  onRefresh: () => void;
  loading: boolean;

  showing: number;
  total: number;
};

export function CallsFiltersBar(p: Props) {
  return (
    <Card className="flex flex-wrap items-center gap-2 p-3">
      <Input value={p.q} onChange={p.setQ} placeholder="Search calls…" className="w-72" />

      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>Outcome</span>
        <select
          value={p.outcome}
          onChange={(e) => p.setOutcome(e.target.value)}
          className="rounded-xl border px-3 py-2 text-sm capitalize"
          style={selectStyle}
        >
          <option value="">All</option>
          {OUTCOMES.map((o) => (
            <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>Limit</span>
        <select
          value={String(p.limit)}
          onChange={(e) => p.setLimit(Number(e.target.value))}
          className="rounded-xl border px-3 py-2 text-sm"
          style={selectStyle}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={String(n)}>{n}</option>
          ))}
        </select>
      </div>

      <Button variant="outline" onClick={p.onRefresh} disabled={p.loading}>
        {p.loading ? "Loading…" : "Refresh"}
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" onClick={p.onPrev} disabled={!p.hasPrev}>Prev</Button>
        <Button variant="ghost" onClick={p.onNext} disabled={!p.hasNext}>Next</Button>
        <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          {p.paused
            ? `${p.showing} filtered`
            : `${p.showing} shown · ${p.total} total`}
        </div>
      </div>
    </Card>
  );
}