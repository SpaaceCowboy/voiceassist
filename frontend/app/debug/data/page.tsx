"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type DebugResult = {
  name: string;
  url: string;
  ok: boolean;
  status: number;
  body: string;
};

async function fetchText(url: string): Promise<DebugResult> {
  const res = await fetch(url, { cache: "no-store" });
  const body = await res.text().catch(() => "");
  return { name: url, url, ok: res.ok, status: res.status, body };
}

export default function DebugDataPage() {
  const [items, setItems] = useState<DebugResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);

    const targets = [
      { name: "Health", url: "/api/backend/api/health" },
      { name: "Patients search q=a", url: "/api/backend/api/patients/search?q=a&limit=5" },
      { name: "Patients search q=test", url: "/api/backend/api/patients/search?q=test&limit=5" },
      { name: "Appointments today", url: `/api/backend/api/appointments?date=${today}&limit=5` },
      { name: "Calls list", url: "/api/backend/api/calls?limit=5&offset=0" },
      { name: "FAQs list", url: "/api/backend/api/faqs" },
    ];

    const results: DebugResult[] = [];
    for (const t of targets) {
      const r = await fetchText(t.url);
      results.push({ ...r, name: t.name });
    }
    setItems(results);
    setLoading(false);
  }

  useEffect(() => {
    void run();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Debug Data</h1>
        <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Raw API responses to verify whether the database contains data.
        </p>
      </div>

      <Button variant="ghost" onClick={run} disabled={loading}>
        {loading ? "Refreshing…" : "Refresh"}
      </Button>

      <div className="space-y-3">
        {items.map((it) => (
          <Card key={it.url} className="p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{it.name}</div>
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                {it.ok ? "OK" : "FAIL"} • {it.status}
              </div>
            </div>
            <div className="text-xs mt-1" style={{ color: "rgb(var(--muted))" }}>
              {it.url}
            </div>
            <pre className="text-xs mt-2 p-3 rounded-xl overflow-auto" style={{ background: "rgb(var(--surface2))" }}>
              {it.body || "(empty)"}
            </pre>
          </Card>
        ))}
      </div>
    </div>
  );
}