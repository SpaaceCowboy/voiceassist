"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, SkeletonStatusTable } from "@/components/ui/Skeleton";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type StatusResponse = {
  summary: { backend: string; okCount: number; total: number; timestamp: string };
  checks: Array<{
    name: string;
    method: string;
    path: string;
    ok: boolean;
    status?: number;
    ms: number;
    preview?: JsonValue;
    error?: string;
  }>;
};

export function StatusPageClient() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const url = typeof window !== "undefined" ? "/api/status/run" : "";
    if (!url) return;
    fetch(url, { cache: "no-store" })
      .then((res) => res.json())
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);

  if (err) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader title="API Status" subtitle="Error loading status." />
        </Card>
        <Card className="p-4 text-red-600 dark:text-red-400">
          {err}
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <SkeletonStatusTable rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="API Status"
          subtitle={`Backend: ${data.summary.backend} • ${data.summary.okCount}/${data.summary.total} OK • ${data.summary.timestamp}`}
        />
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: "rgb(var(--surface2))" }}>
            <tr>
              <th className="text-left p-2">Endpoint</th>
              <th className="text-left p-2">Method</th>
              <th className="text-left p-2">Path</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Latency</th>
              <th className="text-left p-2">Response Preview</th>
            </tr>
          </thead>
          <tbody>
            {data.checks.map((c) => (
              <tr key={`${c.method}:${c.path}`} className="border-t align-top" style={{ borderColor: "rgb(var(--border))" }}>
                <td className="p-2 font-medium">{c.name}</td>
                <td className="p-2">{c.method}</td>
                <td className="p-2 font-mono">{c.path}</td>
                <td className="p-2">
                  <Badge text={c.ok ? "OK" : "FAIL"} tone={c.ok ? "good" : "bad"} />
                  {c.status != null ? <span className="text-xs ml-1" style={{ color: "rgb(var(--muted))" }}>{c.status}</span> : null}
                  {c.error ? <div className="text-xs text-red-600 mt-1">{c.error}</div> : null}
                </td>
                <td className="p-2">{c.ms} ms</td>
                <td className="p-2">
                  <pre
                    className="text-xs p-2 rounded max-h-40 overflow-auto"
                    style={{ background: "rgb(var(--surface2))" }}
                  >
                    {JSON.stringify(c.preview ?? null, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
