"use client";

/* =====================================================================
   Feature mock-ups — one small, real product UI per deep-dive row.
   These replace the old empty skeleton previews: instead of grey
   loading bars, each card shows the assistant actually doing the thing
   the copy describes, built from the same seed data as the rest of the
   page (no lorem ipsum).
   ===================================================================== */

import type { ReactNode, CSSProperties, ReactElement } from "react";

import { CALLERS } from "./data";
import { ClayCard } from "./primitives";
import {
  CalendarIcon,
  HeartPulseIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
} from "@/components/ui/icons";

const inset = {
  background: "rgb(var(--surface2))",
  borderColor: "var(--clay-border)",
} as const;

/* tiny inset tile */
function Tile({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border ${className}`}
      style={{ ...inset, ...style }}
    >
      {children}
    </div>
  );
}

/* lightweight CSS waveform (no JS) — calmer cousin of the hero one */
const WAVE = [0.4, 0.7, 1, 0.55, 0.85, 0.45, 0.95, 0.6, 0.75, 0.5, 0.9, 0.65];
function MiniWave() {
  return (
    <div className="flex h-6 items-center gap-[2.5px]">
      {WAVE.map((h, i) => (
        <span
          key={i}
          className="w-[2.5px] origin-center rounded-full motion-safe:animate-equalize"
          style={{
            height: `${h * 100}%`,
            background: "rgb(var(--accent))",
            animationDelay: `${i * 90}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* outcome chip */
function Chip({
  children,
  tint = "var(--accent)",
}: {
  children: ReactNode;
  tint?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: `rgb(${tint} / 0.14)`, color: `rgb(${tint})` }}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------------- */
/* 1 · Calls & transcripts                                               */
/* --------------------------------------------------------------------- */
function CallsMock() {
  return (
    <ClayCard interactive className="p-5">
      <Tile className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-emerald-500 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-semibold">Live call</span>
          <span
            className="font-mono text-xs tabular-nums"
            style={{ color: "rgb(var(--muted))" }}
          >
            01:24
          </span>
        </div>
        <MiniWave />
      </Tile>

      <div className="mt-3 space-y-1.5 font-mono text-[12.5px] leading-relaxed">
        <p>
          <span className="font-semibold">Caller:</span>{" "}
          <span style={{ color: "rgb(var(--muted))" }}>
            …reschedule my appointment with Dr. Patel.
          </span>
        </p>
        <p>
          <span className="font-semibold" style={{ color: "rgb(var(--accent))" }}>
            VoiceAssist:
          </span>{" "}
          <span style={{ color: "rgb(var(--muted))" }}>
            Monday 2:15 PM is open — shall I move it there?
          </span>
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Chip tint="16 185 129">
          <CheckCircleIcon size={13} /> Booked
        </Chip>
        <Chip>Dr. Patel · Mon 2:15 PM</Chip>
      </div>
    </ClayCard>
  );
}

/* --------------------------------------------------------------------- */
/* 2 · Scheduling                                                        */
/* --------------------------------------------------------------------- */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SLOTS = [
  { time: "9:00 AM", state: "free" as const },
  { time: "9:40 AM", state: "booked" as const, who: "Sarah Chen" },
  { time: "10:20 AM", state: "free" as const },
];

function SchedulingMock() {
  return (
    <ClayCard interactive className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CalendarIcon size={16} />
          Dr. Patel
        </div>
        <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          This week
        </span>
      </div>

      <div className="mb-3 flex gap-1.5">
        {DAYS.map((d) => {
          const active = d === "Thu";
          return (
            <span
              key={d}
              className="flex-1 rounded-xl border py-1.5 text-center text-[11px] font-semibold transition"
              style={
                active
                  ? {
                      background: "rgb(var(--accent))",
                      borderColor: "transparent",
                      color: "#fff",
                    }
                  : { ...inset, color: "rgb(var(--muted))" }
              }
            >
              {d}
            </span>
          );
        })}
      </div>

      <div className="space-y-2">
        {SLOTS.map((s) => {
          const booked = s.state === "booked";
          return (
            <div
              key={s.time}
              className="flex items-center gap-3 rounded-2xl border px-3 py-2.5"
              style={
                booked
                  ? {
                      background: "rgb(var(--accent) / 0.12)",
                      borderColor: "rgb(var(--accent) / 0.35)",
                    }
                  : inset
              }
            >
              <ClockIcon
                size={15}
                className={booked ? "" : "opacity-50"}
              />
              <span className="font-mono text-xs tabular-nums">{s.time}</span>
              <span className="ml-auto text-xs font-medium">
                {booked ? (
                  <span style={{ color: "rgb(var(--accent))" }}>{s.who}</span>
                ) : (
                  <span style={{ color: "rgb(var(--muted))" }}>Available</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </ClayCard>
  );
}

/* --------------------------------------------------------------------- */
/* 3 · Patients                                                          */
/* --------------------------------------------------------------------- */
function PatientsMock() {
  const p = CALLERS[0]; // Sarah Chen
  const initials = p.name
    .split(" ")
    .map((x) => x[0])
    .join("");

  return (
    <ClayCard interactive className="p-5">
      <div className="flex items-center gap-3">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold"
          style={{ background: "rgb(var(--accent) / 0.16)", color: "rgb(var(--accent))" }}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{p.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px]" style={{ color: "rgb(var(--muted))" }}>
            <CheckCircleIcon size={12} />
            Recognised by caller ID
          </div>
        </div>
        <span className="ml-auto">
          <Chip>Returning · 4 visits</Chip>
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <Tile className="flex items-center gap-2.5 px-3 py-2.5">
          <HeartPulseIcon size={15} className="opacity-70" />
          <span className="text-xs font-medium">Last visit · Mar 12</span>
          <span className="ml-auto text-xs" style={{ color: "rgb(var(--muted))" }}>
            Dr. Patel
          </span>
        </Tile>
        <Tile className="flex items-center gap-2.5 px-3 py-2.5">
          <MapPinIcon size={15} className="opacity-70" />
          <span className="text-xs font-medium">Preferred · Downtown clinic</span>
          <span className="ml-auto text-xs" style={{ color: "rgb(var(--muted))" }}>
            2.1 mi
          </span>
        </Tile>
      </div>
    </ClayCard>
  );
}

/* --------------------------------------------------------------------- */
/* 4 · FAQ deflection                                                    */
/* --------------------------------------------------------------------- */
function FaqMock() {
  return (
    <ClayCard interactive className="p-5">
      <div className="space-y-2.5">
        {/* caller question */}
        <div className="flex justify-end">
          <div
            className="max-w-[80%] rounded-2xl rounded-br-md border px-3.5 py-2 text-[12.5px]"
            style={inset}
          >
            Are you open on Saturdays?
          </div>
        </div>
        {/* assistant answer */}
        <div className="flex justify-start">
          <div
            className="max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2 text-[12.5px] leading-relaxed"
            style={{
              background: "rgb(var(--accent) / 0.12)",
              color: "rgb(var(--text))",
            }}
          >
            Yes — Saturdays 9 AM to 1 PM. Walk-in labs only, no appointment
            needed.
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Chip tint="16 185 129">
          <CheckCircleIcon size={13} /> Resolved
        </Chip>
        <span className="text-[11px]" style={{ color: "rgb(var(--muted))" }}>
          Answered from knowledge base · no transfer
        </span>
      </div>
    </ClayCard>
  );
}

/* --------------------------------------------------------------------- */
/* Switchboard                                                           */
/* --------------------------------------------------------------------- */
const MOCKS: Record<string, () => ReactElement> = {
  PhoneIcon: CallsMock,
  CalendarIcon: SchedulingMock,
  HeartPulseIcon: PatientsMock,
  HelpIcon: FaqMock,
};

export function FeatureMock({ icon }: { icon: string }) {
  const Mock = MOCKS[icon] ?? CallsMock;
  return <Mock />;
}
