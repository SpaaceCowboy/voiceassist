// Path: components/patients/detail/PatientHistoryCard.tsx
import { Card } from "@/components/ui/Card";

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
  return d.toLocaleDateString();
}

function fmtTime(t: string): string {
  // "09:00:00" -> "09:00"
  return t?.slice(0, 5) || "—";
}

function statusTone(status: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("cancel")) return "bad";
  if (s.includes("complete")) return "good";
  if (s.includes("no_show")) return "warn";
  if (s.includes("confirm") || s.includes("checked") || s.includes("progress")) return "accent";
  return "neutral";
}

function StatusPill({ value }: { value: string }) {
  const tone = statusTone(value);
  const cls =
    tone === "bad"
      ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200"
      : tone === "good"
        ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-200"
        : tone === "warn"
          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
          : tone === "accent"
            ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200"
            : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200";
  return <span className={`inline-flex px-2 py-1 rounded-full text-xs ${cls}`}>{value || "—"}</span>;
}

export function PatientHistoryCard({ history }: { history: HistoryItem[] }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-semibold">Appointment History</div>
          <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Most recent first.
          </div>
        </div>
        <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
          {history.length} records
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          No history.
        </div>
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}
        >
          <table className="w-full text-sm">
            <thead style={{ background: "rgb(var(--surface2))" }}>
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Provider</th>
                <th className="text-left p-3">Department</th>
                <th className="text-left p-3">Location</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {history.map((h) => (
                <tr
                  key={h.id}
                  className="border-t border-black/10 dark:border-white/10 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                >
                  <td className="p-3 font-medium">{fmtDate(h.appointment_date)}</td>
                  <td className="p-3">{fmtTime(h.appointment_time)}</td>
                  <td className="p-3">{h.appointment_type || "—"}</td>
                  <td className="p-3">
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
                  </td>
                  <td className="p-3">{h.department_name || "—"}</td>
                  <td className="p-3">{h.location_name || "—"}</td>
                  <td className="p-3">
                    <StatusPill value={h.status || "—"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Optional: details drawer later */}
      <div className="text-xs mt-3" style={{ color: "rgb(var(--muted))" }}>
        Next: add “View details” row expansion (reason, confirmation code, source).
      </div>
    </Card>
  );
}