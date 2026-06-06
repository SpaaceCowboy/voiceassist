// components/logs/meta.tsx
// Single source of truth for how severities and sources look across the
// log UI (row colours, dots, chips, icons). Keeps LogRow / Controls in sync.

import * as React from "react";
import {
  PhoneIcon,
  CalendarIcon,
  LayersIcon,
  BoltIcon,
  WrenchIcon,
  SparkIcon,
} from "@/components/ui/icons";
import type { EventSeverity, EventSource } from "@/lib/logs/types";

export const SEVERITY_STYLE: Record<
  EventSeverity,
  { label: string; dot: string; text: string; chip: string; bar: string }
> = {
  info: {
    label: "Info",
    dot: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-300",
    chip: "bg-sky-100 text-sky-700 ring-sky-600/20 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/20",
    bar: "bg-sky-500",
  },
  success: {
    label: "Success",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-300",
    chip: "bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
    bar: "bg-emerald-500",
  },
  warn: {
    label: "Warning",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-300",
    chip: "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
    bar: "bg-amber-500",
  },
  error: {
    label: "Error",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-300",
    chip: "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/20",
    bar: "bg-red-500",
  },
};

export const SOURCE_META: Record<
  EventSource,
  { label: string; Icon: (p: { size?: number; className?: string }) => React.ReactNode }
> = {
  call: { label: "Call", Icon: PhoneIcon },
  appointment: { label: "Appointment", Icon: CalendarIcon },
  session: { label: "Session", Icon: LayersIcon },
  system: { label: "System", Icon: BoltIcon },
  tool: { label: "Tool", Icon: WrenchIcon },
  ai: { label: "Assistant", Icon: SparkIcon },
};

export const ALL_SEVERITIES: EventSeverity[] = ["info", "success", "warn", "error"];
export const ALL_SOURCES: EventSource[] = ["call", "appointment", "ai", "session", "system", "tool"];
