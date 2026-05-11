"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

type CallLike = Record<string, unknown>;

function pickCallSid(c: CallLike) {
  return String(c.callSid ?? c.call_sid ?? c.sid ?? c.id ?? "");
}
function pickCreatedAt(c: CallLike) {
  return String(c.created_at ?? c.createdAt ?? c.timestamp ?? c.time ?? "—");
}
function pickOutcome(c: CallLike) {
  return String(c.outcome ?? c.result ?? c.status ?? "—");
}
function pickIntent(c: CallLike) {
  return String(c.intent ?? c.problem ?? c.category ?? "—");
}
function pickMood(c: CallLike) {
  return String(c.mood ?? c.sentiment ?? "—");
}
function pickDuration(c: CallLike) {
  const v = c.duration_seconds ?? c.durationSeconds ?? c.duration ?? null;
  return v == null ? "—" : `${v}s`;
}
function shortSid(s: string) {
  return s.length > 10 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}
function Pill({ value }: { value: string }) {
  const v = (value || "").toLowerCase();
  const cls =
    v.includes("fail") || v.includes("error")
      ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200"
      : v.includes("transfer")
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
        : v.includes("book") || v.includes("success")
          ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-200"
          : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200";
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${cls}`}>
      {value || "—"}
    </span>
  );
}

export function CallsTableClient({ rows }: { rows: CallLike[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((c) => {
      const hay = [
        pickCallSid(c),
        pickCreatedAt(c),
        pickOutcome(c),
        pickIntent(c),
        pickMood(c),
        pickDuration(c),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(t);
    });
  }, [q, rows]);

  return (
    <div className="space-y-3">
      <Card className="p-3 flex items-center gap-2">
        <Input
          value={q}
          onChange={setQ}
          placeholder="Search calls…"
          className="w-80"
        />
        <div className="text-xs" style={{ color: `rgb(var(--muted))` }}>
          {filtered.length}/{rows.length}
        </div>
      </Card>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: `rgb(var(--surface))`,
          borderColor: `rgb(var(--border))`,
        }}
      >
        <table className="w-full text-sm">
          <thead style={{ background: `rgb(var(--surface2))` }}>
            <tr>
              <th className="text-left p-3">Time</th>
              <th className="text-left p-3">CallSid</th>
              <th className="text-left p-3">Outcome</th>
              <th className="text-left p-3">Intent</th>
              <th className="text-left p-3">Mood</th>
              <th className="text-left p-3">Duration</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const sid = pickCallSid(c);
              return (
                <tr
                  key={sid}
                  className="border-t border-black/5 dark:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                >
                  <td className="p-3">{pickCreatedAt(c)}</td>
                  <td className="p-3">
                    <Link
                      className="underline underline-offset-2"
                      href={`/calls/${sid}`}
                    >
                      {shortSid(sid)}
                    </Link>
                  </td>
                  <td className="p-3">
                    <Pill value={pickOutcome(c)} />
                  </td>
                  <td className="p-3">{pickIntent(c)}</td>
                  <td className="p-3">{pickMood(c)}</td>
                  <td className="p-3">{pickDuration(c)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-6 text-center text-sm"
                  style={{ color: `rgb(var(--muted))` }}
                >
                  No matches.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
