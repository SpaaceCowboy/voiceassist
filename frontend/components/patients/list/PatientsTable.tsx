// Path: components/patients/list/PatientsTable.tsx
import Link from "next/link";
import type { Patient } from "@/lib/types";

function readString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function pickId(p: Patient): string {
  const obj = p as unknown as Record<string, unknown>;
  return (
    readString(obj, "id") ??
    readString(obj, "patient_id") ??
    readString(obj, "patientId") ??
    ""
  );
}

function pickName(p: Patient): string {
  const obj = p as unknown as Record<string, unknown>;
  return (
    readString(obj, "fullName") ??
    readString(obj, "full_name") ??
    readString(obj, "name") ??
    "—"
  );
}

function pickPhone(p: Patient): string {
  const obj = p as unknown as Record<string, unknown>;
  return readString(obj, "phone") ?? readString(obj, "phone_number") ?? "—";
}

function pickDob(p: Patient): string {
  const obj = p as unknown as Record<string, unknown>;
  return readString(obj, "dateOfBirth") ?? readString(obj, "date_of_birth") ?? readString(obj, "dob") ?? "—";
}

function pickEmail(p: Patient): string {
  const obj = p as unknown as Record<string, unknown>;
  return readString(obj, "email") ?? "—";
}

function pickLanguage(p: Patient): string {
  const obj = p as unknown as Record<string, unknown>;
  return readString(obj, "preferredLanguage") ?? "—";
}

export function PatientsTable({ rows }: { rows: Patient[] }) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}
    >
      <table className="w-full text-sm">
        <thead style={{ background: "rgb(var(--surface2))" }}>
          <tr>
            <th className="text-left p-3">Name</th>
            <th className="text-left p-3">Phone</th>
            <th className="text-left p-3">DOB</th>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Language</th>
            <th className="text-left p-3 w-[140px]">Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((pat, idx) => {
            const id = pickId(pat);
            const key = id ? `patient:${id}` : `row:${idx}`;
            return (
              <tr
                key={key}
                className="border-t border-black/10 dark:border-white/10 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              >
                <td className="p-3 font-medium">{pickName(pat)}</td>
                <td className="p-3">{pickPhone(pat)}</td>
                <td className="p-3">{pickDob(pat)}</td>
                <td className="p-3">{pickEmail(pat)}</td>
                <td className="p-3">{pickLanguage(pat)}</td>
                <td className="p-3">
                  {id ? (
                    <Link
                      href={`/patients/${id}`}
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
                    <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                      No ID
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-6 text-center text-sm" style={{ color: "rgb(var(--muted))" }}>
                No results.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}