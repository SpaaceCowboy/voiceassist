// Path: components/sessions/SessionsPageClient.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { SkeletonText } from "@/components/ui/Skeleton";
import { useSessionsStore } from "@/store/sessions";
import { SessionsStatsCards } from "./stats/SessionsStatsCards";
import { SessionsActionsCard } from "./stats/SessionsActionsCard";

export default function SessionsPageClient() {
  const { stats, loading, error, refresh, cleanup, cleaning, cleanupResult, clearResult } =
    useSessionsStore();

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Sessions</h1>
          <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            Session statistics and cleanup.
          </p>
        </div>

        <Button variant="ghost" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error ? <ErrorCard message={error} /> : null}

      {loading && !stats ? (
        <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
          <SkeletonText lines={6} />
        </div>
      ) : (
        <SessionsStatsCards stats={stats} />
      )}

      <SessionsActionsCard
        cleaning={cleaning}
        onCleanup={cleanup}
        cleanupResult={cleanupResult}
        onClearResult={clearResult}
      />
    </div>
  );
}