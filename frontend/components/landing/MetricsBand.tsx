"use client";

/* =====================================================================
   Metrics band — a bento-style "results dashboard".
   Instead of six identical stat cards, this mixes tile sizes and three
   kinds of micro-visualisation (weekly bar chart, radial progress rings,
   an after-hours sparkline) with trend deltas — the pattern premium
   product sites use to make a numbers section feel alive. All figures
   come from METRICS (data.ts); every chart animates in on scroll and is
   neutralised under prefers-reduced-motion via the count-up hook + the
   global motion media query.
   ===================================================================== */

import { useEffect, useRef, useState, type ReactNode } from "react";

import { METRICS, type Metric } from "./data";
import { ClayCard, AccentDot } from "./primitives";
import { useCountUp } from "./hooks";
import {
  PhoneIcon,
  ClockIcon,
  ActivityIcon,
  MoonIcon,
} from "@/components/ui/icons";

/* metric handles by role (order defined in data.ts) */
const HERO = METRICS[0]; // 1,247 calls handled this week
const RING_A = METRICS[1]; // 94.2% answered within 2 rings
const RING_B = METRICS[2]; // 38% deflected from the front desk
const STAT_A = METRICS[3]; // 11.4 hrs receptionist time recovered
const STAT_B = METRICS[4]; // 2m 14s average call duration
const WIDE = METRICS[5]; // 312 after-hours calls captured

const EMERALD = "16 185 129";

function fmt(m: Metric, n: number) {
  const text = m.format
    ? m.format(n)
    : m.decimals
      ? n.toFixed(m.decimals)
      : Math.round(n).toString();
  return `${text}${m.suffix ?? ""}`;
}

/* -------------------------------------------------------------------- */
/* small pieces                                                          */
/* -------------------------------------------------------------------- */
function Trend({ dir, children }: { dir: "up" | "down"; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: `rgb(${EMERALD} / 0.14)`, color: `rgb(${EMERALD})` }}
    >
      <span aria-hidden>{dir === "up" ? "↑" : "↓"}</span>
      {children}
    </span>
  );
}

function IconPill({ children }: { children: ReactNode }) {
  return (
    <span
      className="grid h-10 w-10 place-items-center rounded-2xl transition duration-200 group-hover:scale-110"
      style={{ background: "rgb(var(--accent) / 0.12)", color: "rgb(var(--accent))" }}
    >
      {children}
    </span>
  );
}

function Tile({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-5 transition duration-200 hover:-translate-y-1 hover:shadow-clay-hover ${className}`}
      style={{ background: "rgb(var(--surface2))", borderColor: "var(--clay-border)" }}
    >
      {children}
    </div>
  );
}

function CornerGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-70 blur-2xl"
      style={{ background: "rgb(var(--accent) / 0.16)" }}
    />
  );
}

/* -------------------------------------------------------------------- */
/* weekly bar chart (hero)                                               */
/* -------------------------------------------------------------------- */
const WEEK = [0.42, 0.6, 0.5, 0.82, 1, 0.68, 0.38]; // Mon→Sun, Fri peak

function BarChart({ active }: { active: boolean }) {
  return (
    <div className="flex h-14 items-end gap-1.5">
      {WEEK.map((h, i) => (
        <span
          key={i}
          className="flex-1 origin-bottom rounded-t-md transition-transform duration-700 ease-out"
          style={{
            height: `${h * 100}%`,
            background: h === 1 ? "rgb(var(--accent))" : "rgb(var(--accent) / 0.28)",
            transform: active ? "scaleY(1)" : "scaleY(0)",
            transitionDelay: `${i * 70}ms`,
          }}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* radial progress ring (percentages)                                    */
/* -------------------------------------------------------------------- */
function Ring({
  m,
  active,
  children,
}: {
  m: Metric;
  active: boolean;
  children?: ReactNode;
}) {
  const n = useCountUp(m.target, active, { decimals: m.decimals ?? 0, duration: 1600 });
  const R = 40;
  const C = 2 * Math.PI * R;
  const frac = Math.min(Math.max(n / 100, 0), 1);

  return (
    <Tile className="flex flex-col items-center justify-center text-center">
      <div className="relative grid place-items-center">
        <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            strokeWidth="9"
            style={{ stroke: "rgb(var(--accent) / 0.14)" }}
          />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            style={{
              stroke: "rgb(var(--accent))",
              strokeDasharray: C,
              strokeDashoffset: C * (1 - frac),
              transition: "stroke-dashoffset 0.12s linear",
            }}
          />
        </svg>
        <div className="absolute text-2xl font-bold tabular-nums tracking-tight">
          {fmt(m, n)}
        </div>
      </div>
      <div className="mt-3 text-sm" style={{ color: "rgb(var(--muted))" }}>
        {m.label}
      </div>
      {children && <div className="mt-2">{children}</div>}
    </Tile>
  );
}

/* -------------------------------------------------------------------- */
/* after-hours sparkline (wide)                                          */
/* -------------------------------------------------------------------- */
const NIGHT = [12, 20, 16, 28, 24, 38, 32, 46, 40, 30]; // 6pm → 3am volume

function Sparkline({ active }: { active: boolean }) {
  const W = 220;
  const H = 60;
  const max = Math.max(...NIGHT);
  const min = Math.min(...NIGHT);
  const step = W / (NIGHT.length - 1);
  const pts = NIGHT.map((v, i) => {
    const x = i * step;
    const y = H - ((v - min) / (max - min)) * (H - 10) - 5;
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-16 w-full">
      <defs>
        <linearGradient id="va-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity="0.32" />
          <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={area}
        fill="url(#va-spark)"
        className="transition-opacity duration-700"
        style={{ opacity: active ? 1 : 0 }}
      />
      <path
        d={line}
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: active ? 0 : 1,
          transition: "stroke-dashoffset 1.1s ease-out",
        }}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------- */
/* hero + wide + compact cards                                           */
/* -------------------------------------------------------------------- */
function HeroCard({ active }: { active: boolean }) {
  const n = useCountUp(HERO.target, active, { decimals: 0, duration: 1600 });
  return (
    <Tile className="flex flex-col justify-between gap-5 sm:col-span-2">
      <CornerGlow />
      <div className="relative flex items-start justify-between">
        <IconPill>
          <PhoneIcon size={20} />
        </IconPill>
        <Trend dir="up">18% vs last week</Trend>
      </div>
      <div className="relative">
        <div
          className="text-4xl font-bold tabular-nums tracking-tight sm:text-5xl"
          style={{
            background: "linear-gradient(120deg, rgb(var(--accent)), rgb(var(--accent2)))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {fmt(HERO, n)}
        </div>
        <div className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
          {HERO.label}
        </div>
      </div>
      <div className="relative">
        <BarChart active={active} />
      </div>
    </Tile>
  );
}

function CompactCard({
  m,
  active,
  icon,
  children,
}: {
  m: Metric;
  active: boolean;
  icon: ReactNode;
  children?: ReactNode;
}) {
  const n = useCountUp(m.target, active, { decimals: m.decimals ?? 0 });
  return (
    <Tile className="flex flex-col justify-between gap-5">
      <div className="flex items-start justify-between">
        <IconPill>{icon}</IconPill>
        {children}
      </div>
      <div>
        <div className="whitespace-nowrap text-3xl font-bold tabular-nums tracking-tight">
          {fmt(m, n)}
        </div>
        <div className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
          {m.label}
        </div>
      </div>
    </Tile>
  );
}

function WideCard({ active }: { active: boolean }) {
  const n = useCountUp(WIDE.target, active, { decimals: 0 });
  return (
    <Tile className="flex flex-col justify-between gap-5 sm:col-span-2">
      <CornerGlow />
      <div className="relative flex items-start justify-between">
        <IconPill>
          <MoonIcon size={20} />
        </IconPill>
        <Trend dir="up">24 vs last week</Trend>
      </div>
      <div className="relative flex items-end justify-between gap-4">
        <div className="shrink-0">
          <div className="text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
            {fmt(WIDE, n)}
          </div>
          <div className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
            {WIDE.label}
          </div>
        </div>
        <div className="hidden min-w-0 flex-1 sm:block">
          <Sparkline active={active} />
        </div>
      </div>
    </Tile>
  );
}

/* -------------------------------------------------------------------- */
/* band                                                                  */
/* -------------------------------------------------------------------- */
export function MetricsBand() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="dashboard" className="mx-auto max-w-[1180px] px-6 py-10">
      <ClayCard className="relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(40rem 20rem at 50% -20%, rgb(var(--accent) / 0.12), transparent 65%)",
          }}
        />

        <div className="relative">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <AccentDot />
              The week your front desk just had
            </span>
            <span className="text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
              Across 40+ pilot clinics · last 7 days
            </span>
          </div>

          <div
            ref={ref}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
          >
            <HeroCard active={active} />
            <Ring m={RING_A} active={active}>
              <Trend dir="up">2.1 pts</Trend>
            </Ring>
            <Ring m={RING_B} active={active}>
              <Trend dir="up">5 pts</Trend>
            </Ring>
            <CompactCard m={STAT_A} active={active} icon={<ClockIcon size={20} />}>
              <Trend dir="up">1.3 hrs</Trend>
            </CompactCard>
            <CompactCard m={STAT_B} active={active} icon={<ActivityIcon size={20} />}>
              <Trend dir="down">11s faster</Trend>
            </CompactCard>
            <WideCard active={active} />
          </div>
        </div>
      </ClayCard>
    </section>
  );
}
