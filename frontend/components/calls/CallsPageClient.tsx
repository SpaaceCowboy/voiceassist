// Path: components/calls/CallsPageClient.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useCallsStore } from "@/store/calls";
import { CallsFiltersBar } from "./list/CallsFiltersBar";
import { CallsTable } from "./list/CallsTable";
import { includesQuery } from "@/lib/search";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

type CallLike = Record<string, unknown>;

function s(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function callSearchParts(c: CallLike): string[] {
  return [
    s(c.callSid), s(c.call_sid), s(c.sid), s(c.id),
    s(c.created_at), s(c.createdAt), s(c.timestamp),
    s(c.outcome), s(c.result), s(c.status),
    s(c.intent), s(c.problem), s(c.category),
    s(c.mood), s(c.sentiment),
    s(c.duration_seconds), s(c.durationSeconds), s(c.duration),
  ];
}

export default function CallsPageClient() {
  const {
    q, setQuery,
    limit, setLimit,
    offset, setOffset,
    rows, count,
    loading, error,
    refresh,
  } = useCallsStore();

  const qDebounced = useDebouncedValue(q, 200);

  const searchParams = useSearchParams();
const appliedSearchParam = useRef(false);

useEffect(() => {
  if (appliedSearchParam.current) return;
  const sp = searchParams.get("search")?.trim();
  if (sp) setQuery(sp);
  appliedSearchParam.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset]);

  const filteredRows = useMemo(() => {
    const t = qDebounced.trim();
        if (!t) return rows;
    return rows.filter((c) => includesQuery(callSearchParts(c), t));
  }, [qDebounced, rows]);

  const hasPrev = offset > 0;
  const hasNext = offset + limit < count;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Calls</h1>
        <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Call logs, outcomes, and transcripts.
        </p>
      </div>

      <CallsFiltersBar
        q={q}
        setQ={setQuery}
        limit={limit}
        setLimit={setLimit}
        offset={offset}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={() => setOffset(offset - limit)}
        onNext={() => setOffset(offset + limit)}
        onRefresh={refresh}
        loading={loading}
        showing={filteredRows.length}
        total={count}
      />

      {error ? <ErrorCard message={error} /> : null}
      {loading ? <SkeletonTable rows={8} /> : <CallsTable rows={filteredRows} />}
    </div>
  );
}