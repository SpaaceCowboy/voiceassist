"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CallsTableClient } from "@/components/CallsTableClient";
import { backendGet, BackendError } from "@/lib/backend";

type CallLike = Record<string, unknown>;
type ListEnvelope = { data?: CallLike[] } | CallLike[];

function pickCallSid(c: CallLike) {
  return String(c.callSid ?? c.call_sid ?? c.sid ?? c.id ?? "");
}
function shortSid(s: string) {
  return s.length > 10 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}
function pickCreatedAt(c: CallLike) {
  return String(
    c.created_at ?? c.createdAt ?? c.started_at ?? c.timestamp ?? c.time ?? "—",
  );
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

function outcomeTone(value: string): "bad" | "warn" | "good" | "neutral" {
  const v = (value || "").toLowerCase();
  if (v.includes("fail") || v.includes("error")) return "bad";
  if (v.includes("transfer")) return "warn";
  if (v.includes("book") || v.includes("success") || v.includes("complete"))
    return "good";
  return "neutral";
}

export default function CallsPage() {
  const [rows, setRows] = useState<CallLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await backendGet<ListEnvelope>("/api/calls");
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        if (!cancelled) setRows(list);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof BackendError
            ? `Failed to load (${e.status})`
            : e instanceof Error
              ? e.message
              : "Failed to load",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CallsTableClient rows={rows} />
        <CardHeader title="Calls" subtitle="Call logs and transcripts." />
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: "rgb(var(--surface2))" }}>
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
            {rows.map((c) => {
              const sid = pickCallSid(c);
              return (
                <tr
                  key={sid}
                  className="border-t"
                  style={{ borderColor: "rgb(var(--border))" }}
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
                    <Badge
                      text={pickOutcome(c) || "—"}
                      tone={outcomeTone(pickOutcome(c))}
                    />
                  </td>
                  <td className="p-3">{pickIntent(c)}</td>
                  <td className="p-3">{pickMood(c)}</td>
                  <td className="p-3">{pickDuration(c)}</td>
                </tr>
              );
            })}

            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-6 text-center text-sm"
                  style={{ color: "rgb(var(--muted))" }}
                >
                  {loading ? "Loading…" : error ? error : "No calls found."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
