"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Result = { status: number; body: string };

export default function DebugAuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setResult(null);

    try {
      const res = await fetch("/api/backend/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const text = await res.text().catch(() => "");
      setResult({ status: res.status, body: text || "(empty)" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Auth Debug</h1>
        <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Tests login through ERP proxy and prints raw response.
        </p>
      </div>

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <Input value={email} onChange={setEmail} placeholder="Email" className="w-72" />
        <Input value={password} onChange={setPassword} placeholder="Password" className="w-72" />
        <Button variant="primary" onClick={run} disabled={busy || !email.trim() || !password}>
          {busy ? "Testing…" : "Test Login"}
        </Button>
      </Card>

      {result ? (
        <Card className="p-3">
          <div className="text-sm">HTTP {result.status}</div>
          <pre className="text-xs mt-2 p-3 rounded-xl overflow-auto" style={{ background: "rgb(var(--surface2))" }}>
            {result.body}
          </pre>
        </Card>
      ) : null}
    </div>
  );
}