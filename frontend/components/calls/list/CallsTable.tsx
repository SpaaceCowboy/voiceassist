// Path: components/calls/list/CallsTable.tsx
import Link from "next/link";
import { TableShell, THead, TH, TR, TD } from "@/components/ui/TableShell";

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

function outcomeTone(value: string) {
  const v = (value || "").toLowerCase();
  if (v.includes("fail") || v.includes("error")) return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200";
  if (v.includes("transfer")) return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200";
  if (v.includes("book") || v.includes("success") || v.includes("complete")) return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-200";
  return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200";
}

function Pill({ value }: { value: string }) {
  return <span className={`inline-flex px-2 py-1 rounded-full text-xs ${outcomeTone(value)}`}>{value}</span>;
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
              <TD>{pickCreatedAt(c)}</TD>
              <TD className="font-medium">{sid ? shortSid(sid) : "—"}</TD>
              <TD><Pill value={pickOutcome(c)} /></TD>
              <TD>{pickIntent(c)}</TD>
              <TD>{pickMood(c)}</TD>
              <TD>{pickDuration(c)}</TD>
              <TD>
                {sid ? (
                  <Link
                    href={`/calls/${sid}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                    style={{
                      background: "rgb(var(--surface2))",
                      borderColor: "rgb(var(--border))",
                      color: "rgb(var(--text))",
                    }}
                  >
                    View <span aria-hidden>→</span>
                  </Link>
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