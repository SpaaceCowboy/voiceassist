"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

export function TranscriptPanel({ transcript }: { transcript: string }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return transcript;
    const lines = transcript.split("\n");
    const t = q.toLowerCase();
    return lines.filter((l) => l.toLowerCase().includes(t)).join("\n");
  }, [transcript, q]);

  async function copy() {
    await navigator.clipboard.writeText(transcript);
  }

  return (
    <Section title="Transcript" defaultOpen={false}>
      <div className="flex items-end gap-2 mb-3">
        <Input
          value={q}
          onChange={setQ}
          placeholder="Search in transcript…"
          className="flex-1"
        />
        <Button variant="ghost" onClick={copy}>
          Copy
        </Button>
      </div>
      <pre
        className="text-xs p-3 rounded-xl max-h-[420px] overflow-auto whitespace-pre-wrap"
        style={{
          background: "rgb(var(--surface2))",
          color: "rgb(var(--text))",
        }}
      >
        {filtered || "—"}
      </pre>
    </Section>
  );
}