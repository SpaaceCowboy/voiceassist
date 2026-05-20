// Path: components/appointments/AppointmentsPageClient.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { useAppointmentsStore } from "@/store/appointments";
import { AppointmentsFiltersBar } from "./list/AppointmentsFiltersBar";
import { AppointmentsTable } from "./list/AppointmentsTable";
import { includesQuery } from "@/lib/search";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { Appointment } from "@/lib/types";

function read(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function apptSearchParts(a: Appointment): string[] {
  const o = a as unknown as Record<string, unknown>;
  return [
    read(o, "id"),
    read(o, "patient_name"),
    read(o, "patient_phone"),
    read(o, "department"),
    read(o, "department_name"),
    read(o, "provider_name"),
    read(o, "doctor_name"),
    read(o, "status"),
    read(o, "appointment_date"),
    read(o, "appointment_time"),
    read(o, "scheduled_time"),
    read(o, "reason_for_visit"),
    read(o, "confirmation_code"),
  ];
}

export default function AppointmentsPageClient() {
  const searchParams = useSearchParams();
  const appliedSearchParam = useRef(false);

  const {
    scope,
    setScope,
    date,
    setDate,
    status,
    setStatus,
    q,
    setQuery,
    limit,
    setLimit,
    offset,
    setOffset,
    rows,
    count,
    loading,
    error,
    refresh,
  } = useAppointmentsStore();

  // Apply ?search= exactly once (so it doesn't fight user typing)
  useEffect(() => {
    if (appliedSearchParam.current) return;
    const sp = searchParams.get("search")?.trim();
    if (sp) {
      setQuery(sp);
    }
    appliedSearchParam.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, date, status, limit, offset]);

  const qDebounced = useDebouncedValue(q, 200);

  const filteredRows = useMemo(() => {
    const t = qDebounced.trim();
    if (!t) return rows;
    return rows.filter((a) => includesQuery(apptSearchParts(a), t));
  }, [qDebounced, rows]);

  const hasPrev = offset > 0;
  const hasNext = offset + limit < count;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Appointments</h1>
        <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          View appointments by scope/date with status filter and pagination.
        </p>
      </div>

      <AppointmentsFiltersBar
        scope={scope}
        setScope={setScope}
        date={date}
        setDate={setDate}
        status={status}
        setStatus={setStatus}
        q={q}
        setQ={setQuery}
        limit={limit}
        setLimit={setLimit}
        onRefresh={refresh}
        showing={filteredRows.length}
        total={count}
        offset={offset}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={() => setOffset(offset - limit)}
        onNext={() => setOffset(offset + limit)}
      />

      {error ? <ErrorCard message={error} /> : null}

      {loading ? (
        <SkeletonTable rows={7} />
      ) : (
        <AppointmentsTable rows={filteredRows} />
      )}
    </div>
  );
}
