// Path: components/calls/CallsPageClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { PhoneIcon } from "@/components/ui/icons";
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

  const [outcome, setOutcome] = useState("");
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
    return rows.filter((c) => {
      if (t && !includesQuery(callSearchParts(c), t)) return false;
      if (outcome) {
        const o = (s(c.outcome) || s(c.result) || s(c.status)).toLowerCase();
        if (!o.includes(outcome)) return false;
      }
      return true;
    });
  }, [qDebounced, rows, outcome]);

  // Client-side filtering only sees the current page, so pause server pagination
  // while a filter is active to avoid misleading "Next" jumps.
  const paused = qDebounced.trim().length > 0 || outcome.length > 0;
  const hasPrev = offset > 0 && !paused;
  const hasNext = offset + limit < count && !paused;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<PhoneIcon />}
        title="Calls"
        subtitle="Call logs, outcomes, and transcripts."
        badge={
          !loading ? (
            <span
              className="rounded-full border px-2.5 py-1 text-xs"
              style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
            >
              {count} total
            </span>
          ) : null
        }
      />

      <CallsFiltersBar
        q={q}
        setQ={setQuery}
        outcome={outcome}
        setOutcome={setOutcome}
        limit={limit}
        setLimit={setLimit}
        offset={offset}
        hasPrev={hasPrev}
        hasNext={hasNext}
        paused={paused}
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