// Path: components/patients/details/PatientHistoryCard.tsx
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { TableShell, THead, TH, TR, TD } from "@/components/ui/TableShell";
import { CalendarIcon } from "@/components/ui/icons";

type HistoryItem = {
  id: number;
  appointment_date: string; // ISO date string
  appointment_time: string; // "09:00:00"
  duration_minutes: number;
  appointment_type: string;
  status: string;
  reason_for_visit: string | null;
  doctor_name?: string | null;
  doctor_title?: string | null;
  department_name?: string | null;
  location_name?: string | null;
  source?: string | null;
  confirmation_code?: string | null;
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fmtTime(t: string): string {
  return t?.slice(0, 5) || "—";
}

export function PatientHistoryCard({ history }: { history: HistoryItem[] }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="opacity-60" />
          <div>
            <div className="font-semibold">Appointment history</div>
            <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
              Most recent first.
            </div>
          </div>
        </div>
        <span
          className="rounded-full border px-2.5 py-1 text-xs"
          style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
        >
          {history.length} {history.length === 1 ? "record" : "records"}
        </span>
      </div>

      {history.length === 0 ? (
        <div
          className="rounded-xl border border-dashed py-12 text-center text-sm"
          style={{ borderColor: "rgb(var(--border))", color: "rgb(var(--muted))" }}
        >
          No appointment history yet.
        </div>
      ) : (
        <TableShell>
          <THead>
            <TR>
              <TH>Date</TH>
              <TH>Time</TH>
              <TH>Type</TH>
              <TH>Provider</TH>
              <TH>Department</TH>
              <TH>Location</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            {history.map((h) => (
              <TR key={h.id}>
                <TD className="font-medium">{fmtDate(h.appointment_date)}</TD>
                <TD>{fmtTime(h.appointment_time)}</TD>
                <TD>{h.appointment_type || "—"}</TD>
                <TD>
                  {h.doctor_name ? (
                    <div>
                      <div className="font-medium">{h.doctor_name}</div>
                      {h.doctor_title ? (
                        <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                          {h.doctor_title}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    "—"
                  )}
                </TD>
                <TD>{h.department_name || "—"}</TD>
                <TD>{h.location_name || "—"}</TD>
                <TD>
                  <StatusPill value={h.status || "—"} size="sm" />
                </TD>
              </TR>
            ))}
          </tbody>
        </TableShell>
      )}
    </Card>
  );
}
