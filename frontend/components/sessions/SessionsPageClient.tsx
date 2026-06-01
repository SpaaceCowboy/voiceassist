// Path: components/sessions/SessionsPageClient.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { LayersIcon, RefreshIcon } from "@/components/ui/icons";
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
    <div className="space-y-5">
      <PageHeader
        icon={<LayersIcon />}
        title="Sessions"
        subtitle="Live session statistics and cleanup."
        actions={
          <Button variant="outline" icon={<RefreshIcon size={16} />} onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {error ? <ErrorCard message={error} /> : null}

      {loading && !stats ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
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