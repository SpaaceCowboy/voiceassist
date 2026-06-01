// Path: components/calls/details/CallMetaCard.tsx
import { Card } from "@/components/ui/Card";
import { StatusPill, type Tone } from "@/components/ui/StatusPill";
import { Field, FieldGrid } from "@/components/ui/Field";
import { PhoneIcon } from "@/components/ui/icons";

type CallLike = Record<string, unknown>;

function s(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function toneFromStatus(status: string): Tone {
  const v = status.toLowerCase();
  if (v.includes("fail") || v.includes("error")) return "bad";
  if (v.includes("transfer")) return "warn";
  if (v.includes("complete") || v.includes("success") || v.includes("book")) return "good";
  return "neutral";
}

function fmtTs(v: string): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function CallMetaCard({ call }: { call: CallLike }) {
  const callSid = s(call.call_sid) || s(call.callSid) || s(call.sid) || s(call.id);
  const startedAt = fmtTs(s(call.started_at) || s(call.created_at) || s(call.createdAt) || s(call.timestamp));
  const endedAt = fmtTs(s(call.ended_at) || s(call.endedAt));
  const durationRaw = s(call.duration_seconds) || s(call.durationSeconds) || s(call.duration);
  const status = s(call.status);
  const intent = s(call.intent);
  const patientName = s(call.patient_name);
  const sentiment = s(call.sentiment);
  const sentimentScore = s(call.sentiment_score);
  const from = s(call.from_number);
  const to = s(call.to_number);

  const transferredRaw = String(call.was_transferred ?? "").toLowerCase();
  const wasTransferred =
    transferredRaw === "true" ? "Yes" : transferredRaw === "false" ? "No" : s(call.was_transferred);
  const transferReason = s(call.transfer_reason);
  const errorMessage = s(call.error_message);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PhoneIcon size={18} className="opacity-60" />
          <h2 className="font-semibold">Call overview</h2>
        </div>
        {status ? <StatusPill value={status} tone={toneFromStatus(status)} /> : null}
      </div>

      <FieldGrid cols={4}>
        <Field label="Patient" value={patientName} />
        <Field label="Intent" value={intent} />
        <Field label="From" value={from} mono />
        <Field label="To" value={to} mono />
        <Field label="Started" value={startedAt} />
        <Field label="Ended" value={endedAt} />
        <Field label="Duration" value={durationRaw ? `${durationRaw}s` : null} />
        <Field label="Transferred" value={wasTransferred} />
        <Field label="Sentiment" value={sentiment} />
        <Field label="Sentiment score" value={sentimentScore} />
        <Field label="Transfer reason" value={transferReason} className="lg:col-span-2" />
        {errorMessage ? (
          <Field label="Error" value={errorMessage} className="sm:col-span-2 lg:col-span-4" />
        ) : null}
        <Field label="Call SID" value={callSid} mono className="sm:col-span-2 lg:col-span-4" />
      </FieldGrid>
    </Card>
  );
}
