// Path: components/calls/detail/CallTranscriptCard.tsx
import { Card } from "@/components/ui/Card";
import { TranscriptPanel } from "@/components/transcriptPanel";

type CallLike = Record<string, unknown>;

function s(v: unknown): string {
  if (typeof v === "string") return v;
  return "";
}

export function CallTranscriptCard({ call }: { call: CallLike }) {
  const summary = s(call.summary);
  const transcript =
    s(call.transcript) ||
    s(call.full_transcript) ||
    s(call.conversation_text) ||
    "";

  return (
    <div className="space-y-4">
      {summary ? (
        <Card className="p-4">
          <div className="text-sm font-semibold mb-1">Summary</div>
          <div className="text-sm" style={{ color: "rgb(var(--text))" }}>
            {summary}
          </div>
        </Card>
      ) : null}

      <TranscriptPanel transcript={transcript} />
    </div>
  );
}