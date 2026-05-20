// Path: components/appointments/list/AppointmentsTable.tsx
import Link from "next/link";
import type { Appointment } from "@/lib/types";
import { AppointmentStatusPill } from "./AppointmentStatusPill";
import { TableShell, THead, TH, TR, TD } from "@/components/ui/TableShell";

function readString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function normalizeIntId(raw: string): string | null {
  const s = raw.trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return String(n);
}

function pickIdRaw(a: Appointment): string {
  const o = a as unknown as Record<string, unknown>;
  const keys = ["id", "appointment_id", "appointmentId", "appt_id", "apptId"];
  for (const k of keys) {
    const s = readString(o, k);
    if (s) return s;
  }
  return "";
}

function pickPatientName(a: Appointment): string {
  const o = a as unknown as Record<string, unknown>;
  return (
    readString(o, "patient_name") ??
    readString(o, "patientName") ??
    readString(o, "full_name") ??
    readString(o, "fullName") ??
    "—"
  );
}

function pickDateTime(a: Appointment): string {
  const o = a as unknown as Record<string, unknown>;
  const dtKeys = [
    "scheduled_time",
    "scheduledTime",
    "appointment_date",
    "datetime",
    "start_time",
    "startTime",
    "scheduled_at",
    "scheduledAt",
  ];
  for (const k of dtKeys) {
    const s = readString(o, k);
    if (s) return s;
  }
  const d = readString(o, "date") ?? "";
  const t = readString(o, "time") ?? "";
  const combined = `${d} ${t}`.trim();
  return combined || "—";
}

function pickDepartment(a: Appointment): string {
  const o = a as unknown as Record<string, unknown>;
  return (
    readString(o, "department") ??
    readString(o, "department_name") ??
    readString(o, "departmentName") ??
    "—"
  );
}

function pickProvider(a: Appointment): string {
  const o = a as unknown as Record<string, unknown>;
  return (
    readString(o, "provider_name") ??
    readString(o, "providerName") ??
    readString(o, "doctor_name") ??
    readString(o, "doctorName") ??
    readString(o, "provider") ??
    "—"
  );
}

function pickStatus(a: Appointment): string {
  const o = a as unknown as Record<string, unknown>;
  return readString(o, "status") ?? "—";
}

export function AppointmentsTable({ rows }: { rows: Appointment[] }) {
  return (
    <TableShell>
      <THead>
        <tr>
          <TH>Patient</TH>
          <TH>Date/Time</TH>
          <TH>Department</TH>
          <TH>Provider</TH>
          <TH>Status</TH>
          <TH widthClass="w-[140px]">Actions</TH>
        </tr>
      </THead>

      <tbody>
        {rows.map((a, idx) => {
          const idRaw = pickIdRaw(a);
          const id = idRaw ? normalizeIntId(idRaw) : null;
          const key = id ? `appt:${id}` : `row:${idx}`;

          return (
            <TR key={key}>
              <TD className="font-medium">{pickPatientName(a)}</TD>
              <TD>{pickDateTime(a)}</TD>
              <TD>{pickDepartment(a)}</TD>
              <TD>{pickProvider(a)}</TD>
              <TD>
                <AppointmentStatusPill value={pickStatus(a)} />
              </TD>
              <TD>
                {id ? (
                  <Link
                    href={`/appointments/${id}`}
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
                  <span
                    className="text-xs"
                    style={{ color: "rgb(var(--muted))" }}
                  >
                    No ID
                  </span>
                )}
              </TD>
            </TR>
          );
        })}

        {rows.length === 0 ? (
          <TR>
            <TD colSpan={6} className="p-6 text-center">
              <span className="text-sm" style={{ color: "rgb(var(--muted))" }}>
                No appointments found.
              </span>
            </TD>
          </TR>
        ) : null}
      </tbody>
    </TableShell>
  );
}