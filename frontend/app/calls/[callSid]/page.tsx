import { TranscriptPanel } from "@/components/transcriptPanel";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";
type CallLike = Record<string, unknown>;

async function getCall(callSid: string): Promise<CallLike> {
  const res = await fetch(`/api/backend/api/calls/${callSid}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Call fetch failed: ${res.status}`);
  return res.json();
}

function field(label: string, value: unknown) {
  return (
    <div className="text-sm">
      <div className="text-xs mb-1" style={{ color: "rgb(var(--muted))" }}>{label}</div>
      <div className="break-words">{String(value ?? "—")}</div>
    </div>
  );
}

export default async function CallDetailPage({ params }: { params: { callSid: string } }) {
  const c = await getCall(params.callSid);

  const createdAt = c.created_at ?? c.createdAt ?? c.timestamp ?? "—";
  const outcome = c.outcome ?? c.result ?? c.status ?? "—";
  const intent = c.intent ?? c.problem ?? c.category ?? "—";
  const mood = c.mood ?? c.sentiment ?? "—";
  const duration = c.duration_seconds ?? c.durationSeconds ?? c.duration ?? null;

  const transcript =
    c.transcript ??
    c.full_transcript ??
    c.conversation_text ??
    "";

  const outcomeVal = String(outcome);
  const outcomeTone =
    outcomeVal.toLowerCase().includes("fail") || outcomeVal.toLowerCase().includes("error") ? "bad" :
    outcomeVal.toLowerCase().includes("transfer") ? "warn" :
    outcomeVal.toLowerCase().includes("success") || outcomeVal.toLowerCase().includes("book") ? "good" : "neutral";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={`Call ${params.callSid}`}
          subtitle="Details and transcript."
        />
      </Card>

      <Card className="p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {field("Time", String(createdAt))}
          <div className="text-sm">
            <div className="text-xs mb-1" style={{ color: "rgb(var(--muted))" }}>Outcome</div>
            <div><Badge text={outcomeVal || "—"} tone={outcomeTone} /></div>
          </div>
          {field("Intent", String(intent))}
          {field("Mood", String(mood))}
          {field("Duration", duration == null ? "—" : `${duration}s`)}
        </div>
      </Card>

      <TranscriptPanel transcript={String(transcript)} />

      <Card className="p-4">
        <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Next: add Tool Calls + Errors panels if backend returns those fields.
        </div>
      </Card>
    </div>
  );
}