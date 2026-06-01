import * as React from "react";

export type Tone = "neutral" | "good" | "warn" | "bad" | "accent" | "info";

const TONE_CLASS: Record<Tone, string> = {
  good: "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
  bad: "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/20",
  warn: "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
  accent:
    "bg-violet-100 text-violet-700 ring-violet-600/20 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20",
  info: "bg-sky-100 text-sky-700 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/20",
  neutral:
    "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-white/10 dark:text-slate-300 dark:ring-white/15",
};

const DOT_CLASS: Record<Tone, string> = {
  good: "bg-emerald-500",
  bad: "bg-red-500",
  warn: "bg-amber-500",
  accent: "bg-violet-500",
  info: "bg-sky-500",
  neutral: "bg-slate-400",
};

/** Map a free-form status string to a semantic tone. */
export function toneForStatus(value: string): Tone {
  const s = (value || "").toLowerCase();
  if (/(cancel|fail|error|no[_\s-]?show|delete|offline|down|expired)/.test(s)) return "bad";
  if (/(complete|success|active|confirm|healthy|online|ok|paid|resolved|up)\b|2\d\d/.test(s))
    return "good";
  if (/(pending|wait|warn|progress|partial|retry|degraded|hold|3\d\d)/.test(s)) return "warn";
  if (/(checked|scheduled|booked|new|open|in[_\s-]?progress)/.test(s)) return "accent";
  if (/(info|note|reschedul|transfer)/.test(s)) return "info";
  return "neutral";
}

function humanizeStatus(value: string): string {
  if (!value) return "—";
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusPill({
  value,
  tone,
  dot = true,
  humanize = true,
  size = "md",
}: {
  value: string;
  tone?: Tone;
  dot?: boolean;
  humanize?: boolean;
  size?: "sm" | "md";
}) {
  const t = tone ?? toneForStatus(value);
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${pad} ${TONE_CLASS[t]}`}
    >
      {dot ? <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[t]}`} /> : null}
      {humanize ? humanizeStatus(value) : value || "—"}
    </span>
  );
}
