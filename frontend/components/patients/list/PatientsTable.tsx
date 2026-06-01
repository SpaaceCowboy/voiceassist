// Path: components/patients/list/PatientsTable.tsx
import type { Patient } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { TableShell, THead, TH, TR, TD } from "@/components/ui/TableShell";

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
  return readString(obj, "preferredLanguage") ?? readString(obj, "preferred_language") ?? "—";
}

export function PatientsTable({ rows }: { rows: Patient[] }) {
  return (
    <TableShell>
      <THead>
        <tr>
          <TH>Name</TH>
          <TH>Phone</TH>
          <TH>DOB</TH>
          <TH>Email</TH>
          <TH>Language</TH>
          <TH widthClass="w-[120px]">Actions</TH>
        </tr>
      </THead>

      <tbody>
        {rows.map((pat, idx) => {
          const id = pickId(pat);
          const key = id ? `patient:${id}` : `row:${idx}`;
          return (
            <TR key={key}>
              <TD className="font-medium">{pickName(pat)}</TD>
              <TD>{pickPhone(pat)}</TD>
              <TD>{pickDob(pat)}</TD>
              <TD>{pickEmail(pat)}</TD>
              <TD>{pickLanguage(pat)}</TD>
              <TD>
                {id ? (
                  <Button variant="outline" size="sm" href={`/patients/${id}`}>
                    View
                  </Button>
                ) : (
                  <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                    No ID
                  </span>
                )}
              </TD>
            </TR>
          );
        })}

        {rows.length === 0 ? (
          <TR>
            <TD colSpan={6} className="p-6 text-center text-sm" style={{ color: "rgb(var(--muted))" }}>
              No results.
            </TD>
          </TR>
        ) : null}
      </tbody>
    </TableShell>
  );
}
