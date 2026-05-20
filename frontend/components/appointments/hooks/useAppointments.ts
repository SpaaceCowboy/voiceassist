// Path: components/appointments/hooks/useAppointments.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Appointment } from "@/lib/types";
import { getAppointments } from "@/lib/api/voiceAssistantApi";
import {
  type AppointmentStatusFilter,
  type DateScope,
  todayISO,
} from "../types/appointments";

type ApiList<T> = { success: boolean; data: T[]; count: number };

export type UseAppointmentsState = {
  scope: DateScope;
  setScope: (v: DateScope) => void;

  date: string;
  setDate: (v: string) => void;

  status: AppointmentStatusFilter;
  setStatus: (v: AppointmentStatusFilter) => void;

  q: string;
  setQ: (v: string) => void;

  limit: number;
  setLimit: (v: number) => void;

  offset: number;
  setOffset: (v: number) => void;

  loading: boolean;
  error: string | null;

  rows: Appointment[];
  count: number;

  refresh: () => void;

  // derived
  filteredRows: Appointment[];
  hasPrev: boolean;
  hasNext: boolean;
};

function clampOffset(n: number): number {
  return n < 0 ? 0 : n;
}

// Keep these mapping helpers here for now; later we can strongly type Appointment.
function pickId(a: Appointment): string {
  const obj = a as unknown as Record<string, unknown>;
  const v = obj["id"];
  return v == null ? "" : String(v);
}
function pickStatus(a: Appointment): string {
  const obj = a as unknown as Record<string, unknown>;
  const v = obj["status"];
  return v == null ? "" : String(v);
}
function pickDateTime(a: Appointment): string {
  const obj = a as unknown as Record<string, unknown>;
  const dt = obj["datetime"] ?? obj["start_time"];
  if (dt != null) return String(dt);
  const date = obj["date"];
  const time = obj["time"];
  const s = `${date ?? ""} ${time ?? ""}`.trim();
  return s || "";
}
function pickPatientName(a: Appointment): string {
  const obj = a as unknown as Record<string, unknown>;
  const v = obj["patient_name"] ?? obj["full_name"] ?? obj["name"];
  return v == null ? "" : String(v);
}
function pickDepartment(a: Appointment): string {
  const obj = a as unknown as Record<string, unknown>;
  const v = obj["department"] ?? obj["specialty"];
  return v == null ? "" : String(v);
}
function pickProvider(a: Appointment): string {
  const obj = a as unknown as Record<string, unknown>;
  const v = obj["provider_name"] ?? obj["doctor"] ?? obj["provider"];
  return v == null ? "" : String(v);
}

export function useAppointments(): UseAppointmentsState {
  const [scope, setScope] = useState<DateScope>("today");
  const [date, setDate] = useState<string>(todayISO());
  const [status, setStatus] = useState<AppointmentStatusFilter>("");
  const [q, setQ] = useState<string>("");

  const [limit, setLimit] = useState<number>(25);
  const [offset, setOffsetRaw] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<Appointment[]>([]);
  const [count, setCount] = useState<number>(0);

  const offsetSafe = clampOffset(offset);
  const setOffset = (v: number) => setOffsetRaw(clampOffset(v));

  const dateParam =
    scope === "all" ? undefined : scope === "today" ? todayISO() : date || undefined;

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res: ApiList<Appointment> = await getAppointments({
        date: dateParam,
        status: status || undefined,
        limit,
        offset: offsetSafe,
      });
      setRows(res.data);
      setCount(res.count);
    } catch (e: unknown) {
      setRows([]);
      setCount(0);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // reset paging when filters change
  useEffect(() => {
    setOffsetRaw(0);
     
  }, [scope, date, status, limit]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, date, status, limit, offsetSafe]);

  const filteredRows = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((a) => {
      const hay = [
        pickId(a),
        pickStatus(a),
        pickDateTime(a),
        pickPatientName(a),
        pickDepartment(a),
        pickProvider(a),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(t);
    });
  }, [q, rows]);

  const hasPrev = offsetSafe > 0;
  const hasNext = offsetSafe + limit < count;

  return {
    scope,
    setScope,
    date,
    setDate,
    status,
    setStatus,
    q,
    setQ,
    limit,
    setLimit,
    offset: offsetSafe,
    setOffset,
    loading,
    error,
    rows,
    count,
    filteredRows,
    hasPrev,
    hasNext,
    refresh: load,
  };
}