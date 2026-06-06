"use client";

import * as React from "react";
import Link from "next/link";
import { PhoneIcon, SparkIcon, WrenchIcon, CalendarIcon, BoltIcon, LayersIcon } from "@/components/ui/icons";
import type { LiveEvent } from "@/lib/logs/types";
import { SEVERITY_STYLE } from "./meta";

function fmtClock(ts: number): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "--:--:--";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

/** A one-word outcome chip derived from the call's events. */
function callOutcome(events: LiveEvent[]): { label: string; tone: keyof typeof SEVERITY_STYLE } | null {
  let result: { label: string; tone: keyof typeof SEVERITY_STYLE } | null = { label: "In progress", tone: "info" };
  for (const e of events) {
    const t = e.title.toLowerCase();
    if (e.source === "appointment" && e.severity === "success") result = { label: "Booked", tone: "success" };
    else if (t.includes("rescheduled")) result = { label: "Rescheduled", tone: "info" };
    else if (t.includes("cancelled")) result = { label: "Cancelled", tone: "warn" };
    else if (t.includes("transferred")) result = { label: "Transferred", tone: "warn" };
    else if (t.includes("call ended") && result?.label === "In progress") result = { label: "Ended", tone: "info" };
  }
  return result;
}

function metaPairs(meta: LiveEvent["meta"]): Array<[string, string]> {
  if (!meta) return [];
  return Object.entries(meta)
    .filter(([k, v]) => k !== "callSid" && v !== undefined && v !== null && v !== "")
    .map(([k, v]) => [k, String(v)] as [string, string]);
}

function TurnRow({ event }: { event: LiveEvent }) {
  const [open, setOpen] = React.useState(false);
  const sev = SEVERITY_STYLE[event.severity];
  const isUser = event.role === "user";
  const isAssistant = event.role === "assistant";
  const pairs = metaPairs(event.meta);

  // Conversation turns render as labelled speech lines.
  if (isUser || isAssistant) {
    return (
      <div className="flex items-start gap-2.5 px-3 py-1.5">
        <time className="mt-1 w-[58px] shrink-0 font-mono text-[10px] tabular-nums" style={{ color: "rgb(var(--muted))" }}>
          {fmtClock(event.ts)}
        </time>
        <span
          className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
            isUser ? "" : "ring-1 ring-inset " + SEVERITY_STYLE.info.chip
          }`}
          style={isUser ? { background: "rgb(var(--surface2))", color: "rgb(var(--muted))" } : undefined}
        >
          {isUser ? "Caller" : <><SparkIcon size={11} /> AI</>}
        </span>
        <p
          className="min-w-0 flex-1 rounded-2xl px-3 py-1.5 text-sm"
          style={{
            background: isAssistant ? "rgba(var(--accent),0.10)" : "rgb(var(--surface2))",
            color: "rgb(var(--text))",
          }}
        >
          {event.title}
          {event.detail && isUser ? (
            <span className="ml-2 align-middle text-[10px]" style={{ color: "rgb(var(--muted))" }}>
              {event.detail}
            </span>
          ) : null}
        </p>
      </div>
    );
  }

  // Tool calls, bookings, transfers, system lines: compact actionable rows.
  const Icon =
    event.source === "appointment" ? CalendarIcon : event.source === "tool" ? WrenchIcon : event.source === "session" ? LayersIcon : BoltIcon;
  const expandable = pairs.length > 0;

  return (
    <div className="px-3 py-1">
      <button
        type="button"
        onClick={expandable ? () => setOpen((o) => !o) : undefined}
        className={`flex w-full items-center gap-2.5 text-left ${expandable ? "cursor-pointer" : "cursor-default"}`}
      >
        <time className="w-[58px] shrink-0 font-mono text-[10px] tabular-nums" style={{ color: "rgb(var(--muted))" }}>
          {fmtClock(event.ts)}
        </time>
        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md ${sev.chip}`}>
          <Icon size={12} />
        </span>
        <span className={`text-sm font-medium ${sev.text}`}>{event.title}</span>
        {event.detail ? (
          <span className="truncate text-xs" style={{ color: "rgb(var(--muted))" }}>
            {event.detail}
          </span>
        ) : null}
      </button>
      {open && expandable ? (
        <div className="mb-1 ml-[70px] mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {pairs.map(([k, v]) => (
            <span key={k} className="font-mono text-[11px]" style={{ color: "rgb(var(--muted))" }}>
              <span className="opacity-70">{k}:</span> <span style={{ color: "rgb(var(--text))" }}>{v}</span>
            </span>
          ))}
          {event.ref ? (
            <Link href={event.ref.href} className="text-[11px] font-medium underline-offset-2 hover:underline" style={{ color: "rgb(var(--accent))" }}>
              {event.ref.label} →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function CallCard({ callSid, events }: { callSid: string; events: LiveEvent[] }) {
  const first = events[0];
  const fromDetail = first?.title === "Incoming call" ? first.detail : undefined;
  const outcome = callOutcome(events);
  const start = events[0]?.ts;
  const end = events[events.length - 1]?.ts;
  const historical = events.every((e) => e.historical);
  const oc = outcome ? SEVERITY_STYLE[outcome.tone] : null;

  return (
    <div
      className="overflow-hidden border-b"
      style={{ borderColor: "rgb(var(--border))", opacity: historical ? 0.85 : 1 }}
    >
      {/* Call header */}
      <div className="flex items-center gap-2.5 px-3 py-2" style={{ background: "rgb(var(--surface2))" }}>
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg" style={{ background: "rgba(var(--accent),0.14)", color: "rgb(var(--accent))" }}>
          <PhoneIcon size={13} />
        </span>
        <span className="font-mono text-xs font-semibold" style={{ color: "rgb(var(--text))" }}>
          {callSid}
        </span>
        {fromDetail ? (
          <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            {fromDetail}
          </span>
        ) : null}
        <span className="ml-auto flex items-center gap-2">
          {oc ? (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${oc.chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${oc.dot}`} />
              {outcome?.label}
            </span>
          ) : null}
          <time className="font-mono text-[10px] tabular-nums" style={{ color: "rgb(var(--muted))" }}>
            {fmtClock(start)}
            {end && end !== start ? `–${fmtClock(end)}` : ""}
          </time>
        </span>
      </div>

      {/* Threaded turns */}
      <div className="py-1">
        {events.map((e) => (
          <TurnRow key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}
