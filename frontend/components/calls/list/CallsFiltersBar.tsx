// Path: components/calls/list/CallsFiltersBar.tsx
"use client";

import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  q: string;
  setQ: (v: string) => void;

  limit: number;
  setLimit: (n: number) => void;

  offset: number;
  hasPrev: boolean;
  hasNext: boolean;

  onPrev: () => void;
  onNext: () => void;

  onRefresh: () => void;
  loading: boolean;

  showing: number;
  total: number;
};

export function CallsFiltersBar(p: Props) {
  return (
    <Card className="p-3 flex flex-wrap gap-2 items-center">
      <Input value={p.q} onChange={p.setQ} placeholder="Search calls…" className="w-80" />

      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>Limit</span>
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
            <option key={n} value={String(n)}>{n}</option>
          ))}
        </select>
      </div>

      <Button variant="primary" onClick={p.onRefresh} disabled={p.loading}>
        {p.loading ? "Loading…" : "Refresh"}
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" onClick={p.onPrev} disabled={!p.hasPrev}>Prev</Button>
        <Button variant="ghost" onClick={p.onNext} disabled={!p.hasNext}>Next</Button>

        <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          {p.showing} shown • total {p.total} • offset {p.offset}
        </div>
      </div>
    </Card>
  );
}