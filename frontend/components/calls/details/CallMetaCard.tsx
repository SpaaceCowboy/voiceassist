// Path: components/calls/detail/CallMetaCard.tsx
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type CallLike = Record<string, unknown>;

function s(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function field(label: string, value: string) {
  return (
    <div className="text-sm">
      <div className="text-xs mb-1" style={{ color: "rgb(var(--muted))" }}>
        {label}
      </div>
      <div className="break-words">{value || "—"}</div>
    </div>
  );
}

function toneFromStatus(status: string): "bad" | "warn" | "good" | "neutral" {
  const v = status.toLowerCase();
  if (v.includes("fail") || v.includes("error")) return "bad";
  if (v.includes("transfer")) return "warn";
  if (v.includes("complete") || v.includes("success") || v.includes("book")) return "good";
  return "neutral";
}

export function CallMetaCard({ call }: { call: CallLike }) {
  const callSid = s(call.call_sid) || s(call.callSid) || s(call.sid) || s(call.id);

  const startedAt = s(call.started_at) || s(call.created_at) || s(call.createdAt) || s(call.timestamp) || "—";
  const endedAt = s(call.ended_at) || s(call.endedAt) || "—";
  const duration = s(call.duration_seconds) || s(call.durationSeconds) || s(call.duration) || "—";

  const status = s(call.status) || "—";
  const intent = s(call.intent) || "—";

  const patientName = s(call.patient_name) || "—";
  const sentiment = s(call.sentiment) || "—";
  const sentimentScore = s(call.sentiment_score) || "—";

  const from = s(call.from_number) || "—";
  const to = s(call.to_number) || "—";

  const wasTransferred = String(call.was_transferred ?? "").toLowerCase() === "true" ? "Yes" : String(call.was_transferred ?? "") === "false" ? "No" : s(call.was_transferred) || "—";
  const transferReason = s(call.transfer_reason) || "—";
  const errorMessage = s(call.error_message) || "—";

  return (
    <Card className="p-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {field("CallSid", callSid || "—")}
        {field("Patient", patientName)}
        {field("Intent", intent)}

        <div className="text-sm">
          <div className="text-xs mb-1" style={{ color: "rgb(var(--muted))" }}>
            Status
          </div>
          <div>
            <Badge text={status || "—"} tone={toneFromStatus(status)} />
          </div>
        </div>

        {field("Started", startedAt)}
        {field("Ended", endedAt)}
        {field("Duration", duration === "—" ? "—" : `${duration}s`)}

        {field("From", from)}
        {field("To", to)}

        {field("Sentiment", sentiment)}
        {field("Sentiment score", sentimentScore)}
        {field("Transferred", wasTransferred)}
        {field("Transfer reason", transferReason)}
        {field("Error", errorMessage)}
      </div>
    </Card>
  );
}