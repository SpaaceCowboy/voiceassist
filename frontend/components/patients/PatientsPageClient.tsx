// Path: components/patients/PatientsPageClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { HeartPulseIcon, SearchIcon } from "@/components/ui/icons";
import { usePatientsStore } from "@/store/patients";
import { PatientsFiltersBar } from "./list/PatientsFiltersBar";
import { PatientsTable } from "./list/PatientsTable";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

function readSearchFromLocation(): string {
  if (typeof window === "undefined") return "";
  const sp = new URLSearchParams(window.location.search);
  return sp.get("search")?.trim() ?? "";
}

export default function PatientsPageClient() {
  const appliedSearchParam = useRef(false);
  const [searchParam, setSearchParam] = useState<string>("");

  const {
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
  } = usePatientsStore();

  // Read ?search= client-side (avoids useSearchParams build/Suspense constraints)
  useEffect(() => {
    setSearchParam(readSearchFromLocation());
  }, []);

  // Apply it exactly once
  useEffect(() => {
    if (appliedSearchParam.current) return;
    if (searchParam) setQuery(searchParam);
    appliedSearchParam.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam]);

  const qDebounced = useDebouncedValue(q, 300);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset, qDebounced]);

  const hasPrev = offset > 0;
  const hasNext = offset + limit < count;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<HeartPulseIcon />}
        title="Patients"
        subtitle="Search patients and open a profile with full appointment history."
      />

      <PatientsFiltersBar
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
        showing={rows.length}
        total={count}
      />

      {error ? <ErrorCard message={error} /> : null}
      {loading ? (
        <SkeletonTable rows={6} />
      ) : rows.length === 0 ? (
        <div
          className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-12 text-center text-sm"
          style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
        >
          <SearchIcon size={28} className="opacity-50" />
          {q.trim()
            ? `No patients match “${q.trim()}”.`
            : "No patients found."}
        </div>
      ) : (
        <PatientsTable rows={rows} />
      )}
    </div>
  );
}
