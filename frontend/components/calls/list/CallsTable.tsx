// Path: components/calls/list/CallsTable.tsx
import { TableShell, THead, TH, TR, TD } from "@/components/ui/TableShell";
import { StatusPill, type Tone } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";

type CallLike = Record<string, unknown>;

function s(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function pickCallSid(c: CallLike): string {
  return s(c.callSid) || s(c.call_sid) || s(c.sid) || s(c.id);
}
function pickCreatedAt(c: CallLike): string {
  return s(c.created_at) || s(c.createdAt) || s(c.timestamp) || s(c.time) || "—";
}
function pickOutcome(c: CallLike): string {
  return s(c.outcome) || s(c.result) || s(c.status) || "—";
}
function pickIntent(c: CallLike): string {
  return s(c.intent) || s(c.problem) || s(c.category) || "—";
}
function pickMood(c: CallLike): string {
  return s(c.mood) || s(c.sentiment) || "—";
}
function pickDuration(c: CallLike): string {
  const v = c.duration_seconds ?? c.durationSeconds ?? c.duration ?? null;
  return v == null ? "—" : `${v}s`;
}
function shortSid(x: string) {
  return x.length > 12 ? `${x.slice(0, 6)}…${x.slice(-4)}` : x;
}

function fmtTime(raw: string): string {
  if (!raw || raw === "—") return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function outcomeTone(value: string): Tone {
  const v = (value || "").toLowerCase();
  if (v.includes("fail") || v.includes("error")) return "bad";
  if (v.includes("transfer")) return "warn";
  if (v.includes("book") || v.includes("success") || v.includes("complete")) return "good";
  return "info";
}

export function CallsTable({ rows }: { rows: CallLike[] }) {
  return (
    <TableShell>
      <THead>
        <tr>
          <TH>Time</TH>
          <TH>CallSid</TH>
          <TH>Outcome</TH>
          <TH>Intent</TH>
          <TH>Mood</TH>
          <TH>Duration</TH>
          <TH widthClass="w-[140px]">Actions</TH>
        </tr>
      </THead>

      <tbody>
        {rows.map((c, idx) => {
          const sid = pickCallSid(c);
          const key = sid ? `call:${sid}` : `row:${idx}`;

          return (
            <TR key={key}>
              <TD className="whitespace-nowrap">{fmtTime(pickCreatedAt(c))}</TD>
              <TD className="font-mono text-xs">{sid ? shortSid(sid) : "—"}</TD>
              <TD><StatusPill value={pickOutcome(c)} tone={outcomeTone(pickOutcome(c))} size="sm" /></TD>
              <TD>{pickIntent(c)}</TD>
              <TD>{pickMood(c)}</TD>
              <TD>{pickDuration(c)}</TD>
              <TD>
                {sid ? (
                  <Button variant="outline" size="sm" href={`/calls/${sid}`}>
                    View
                  </Button>
                ) : (
                  <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>No SID</span>
                )}
              </TD>
            </TR>
          );
        })}

        {rows.length === 0 ? (
          <TR>
            <TD colSpan={7} className="p-6 text-center">
              <span className="text-sm" style={{ color: "rgb(var(--muted))" }}>
                No calls found.
              </span>
            </TD>
          </TR>
        ) : null}
      </tbody>
    </TableShell>
  );
}