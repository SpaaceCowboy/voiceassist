"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

import { CALLERS, METRICS, TRANSCRIPT } from "./data";
import { useCountUp, useTypewriter, usePrefersReducedMotion } from "./hooks";

const STATUS_TINT: Record<string, string> = {
  booked: "16 185 129",
  rescheduled: "56 189 248",
  callback: "251 191 36",
  routed: "139 92 246",
  resolved: "20 184 166",
};

const BAR_COUNT = 24;
const BASE_BARS = Array.from({ length: BAR_COUNT }, (_, i) =>
  0.3 + Math.abs(Math.sin(i * 1.3)) * 0.6
);

function Waveform({ active }: { active: boolean }) {
  const scope = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();

  useGSAP(
    () => {
      // Pause the infinite tween when the hero is scrolled out of view so it
      // stops competing with the scroll for main-thread / compositor time.
      if (reduce || !active) return;
      gsap.to(scope.current!.querySelectorAll("[data-bar]"), {
        scaleY: () => 0.25 + Math.random() * 0.75,
        duration: 0.4,
        ease: "sine.inOut",
        stagger: { each: 0.05, from: "center" },
        repeat: -1,
        yoyo: true,
      });
    },
    { scope, dependencies: [reduce, active] }
  );

  return (
    <div ref={scope} className="flex h-8 items-center gap-[3px]">
      {BASE_BARS.map((h, i) => (
        <span
          key={i}
          data-bar
          className="w-[3px] origin-center rounded-full"
          style={{ height: `${h * 100}%`, background: "rgb(var(--accent))" }}
        />
      ))}
    </div>
  );
}

function MiniMetric({
  target,
  decimals,
  suffix,
  label,
  active,
  format,
}: {
  target: number;
  decimals?: number;
  suffix?: string;
  label: string;
  active: boolean;
  format?: (n: number) => string;
}) {
  const n = useCountUp(target, active, { decimals: decimals ?? 0 });
  const text = format ? format(n) : decimals ? n.toFixed(decimals) : Math.round(n).toString();
  return (
    <div>
      <div className="text-lg font-bold tabular-nums" style={{ color: "rgb(var(--text))" }}>
        {text}
        {suffix}
      </div>
      <div className="text-[11px]" style={{ color: "rgb(var(--muted))" }}>
        {label}
      </div>
    </div>
  );
}

export function DashboardFrame() {
  // The hero frame starts live (it's above the fold), but pauses its loops
  // once scrolled out of view to keep the rest of the page scrolling smoothly.
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const lines = TRANSCRIPT.map((t) => `${t.speaker}: ${t.text}`);
  const { visible, activeLine } = useTypewriter(lines, { active });

  return (
    <div
      ref={rootRef}
      data-hero-visual
      className="bg-clay-surface rounded-clay-lg border p-4 shadow-clay sm:p-5"
      style={{ borderColor: "var(--clay-border)" }}
    >
      {/* Live calls strip */}
      <div
        data-hero-chip
        className="flex items-center justify-between rounded-2xl border px-4 py-3"
        style={{ background: "rgb(var(--surface2))", borderColor: "var(--clay-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-semibold">2 calls active</span>
        </div>
        <Waveform active={active} />
      </div>

      {/* Live transcript */}
      <div
        data-hero-chip
        className="mt-3 rounded-2xl border p-4"
        style={{ background: "rgb(var(--surface2))", borderColor: "var(--clay-border)" }}
      >
        <div
          className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "rgb(var(--muted))" }}
        >
          Live transcript
        </div>
        <div className="min-h-[112px] space-y-1.5 font-mono text-[12.5px] leading-relaxed">
          {TRANSCRIPT.map((t, i) => {
            const isAssistant = t.speaker === "VoiceAssist";
            const shown = visible[i] ?? "";
            if (!shown) return null;
            const [, ...rest] = shown.split(": ");
            const body = rest.join(": ");
            return (
              <div key={i}>
                <span
                  className="font-semibold"
                  style={{ color: isAssistant ? "rgb(var(--accent))" : "rgb(var(--text))" }}
                >
                  {t.speaker}:
                </span>{" "}
                <span style={{ color: "rgb(var(--muted))" }}>{body}</span>
                {i === activeLine && (
                  <span
                    className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse"
                    style={{ background: "rgb(var(--accent))" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's metrics */}
      <div
        data-hero-chip
        className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border px-4 py-3"
        style={{ background: "rgb(var(--surface2))", borderColor: "var(--clay-border)" }}
      >
        <MiniMetric {...METRICS[0]} active={active} />
        <MiniMetric {...METRICS[1]} active={active} />
        <MiniMetric {...METRICS[5]} active={active} />
      </div>

      {/* Recent callers */}
      <div className="mt-3 space-y-2">
        {CALLERS.slice(0, 3).map((c) => {
          const initials = c.name
            .split(" ")
            .map((p) => p[0])
            .join("");
          const tint = STATUS_TINT[c.status];
          return (
            <div
              key={c.name}
              className="flex items-center gap-3 rounded-2xl border px-3 py-2.5"
              style={{ background: "rgb(var(--surface2))", borderColor: "var(--clay-border)" }}
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold"
                style={{ background: `rgb(${tint} / 0.16)`, color: `rgb(${tint})` }}
              >
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{c.name}</div>
                <div className="truncate text-xs" style={{ color: "rgb(var(--muted))" }}>
                  {c.action}
                </div>
              </div>
              <span
                className="hidden shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold sm:inline"
                style={{ background: `rgb(${tint} / 0.14)`, color: `rgb(${tint})` }}
              >
                {c.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
