// Path: components/patients/detail/PatientProfileCard.tsx
"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Patient } from "@/lib/types";
import type { PatientPatchPayload } from "./PatientDetailClient";

function r(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

function rNum(obj: Record<string, unknown>, key: string): number {
  const v = obj[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v.trim())) return Number(v.trim());
  return 0;
}

export function PatientProfileCard({
  patient,
  saving,
  onSave,
}: {
  patient: Patient;
  saving: boolean;
  onSave: (patch: PatientPatchPayload) => void;
}) {
  const p = patient as unknown as Record<string, unknown>;

  const initial = useMemo(
    () => ({
      fullName: r(p, "fullName") || r(p, "full_name") || r(p, "name"),
      email: r(p, "email"),
      dateOfBirth: r(p, "dateOfBirth") || r(p, "date_of_birth"),
      address: r(p, "address"),
      insuranceProvider: r(p, "insuranceProvider"),
      insuranceId: r(p, "insuranceId") || r(p, "insurance_id"),
      emergencyContactName: r(p, "emergencyContactName"),
      emergencyContactPhone: r(p, "emergencyContactPhone"),
      preferredLanguage: r(p, "preferredLanguage"),
      preferredLocationId: rNum(p, "preferredLocationId"),
      preferredDoctorId: rNum(p, "preferredDoctorId"),
      notes: r(p, "notes"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patient],
  );

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(initial);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function submit() {
    const payload: PatientPatchPayload = {
      fullName: form.fullName || undefined,
      email: form.email || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      address: form.address || undefined,
      insuranceProvider: form.insuranceProvider || undefined,
      insuranceId: form.insuranceId || undefined,
      emergencyContactName: form.emergencyContactName || undefined,
      emergencyContactPhone: form.emergencyContactPhone || undefined,
      preferredLanguage: form.preferredLanguage || undefined,
      preferredLocationId: form.preferredLocationId || undefined,
      preferredDoctorId: form.preferredDoctorId || undefined,
      notes: form.notes || undefined,
    };
    onSave(payload);
    setEdit(false);
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Patient
          </div>
          <div className="text-lg font-semibold">{initial.fullName || "—"}</div>
          <div className="text-xs mt-1" style={{ color: "rgb(var(--muted))" }}>
            Phone: {r(p, "phone") || r(p, "phone_number") || "—"} • DOB:{" "}
            {initial.dateOfBirth || "—"}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setForm(initial);
              setEdit((v) => !v);
            }}
          >
            {edit ? "Close" : "Edit"}
          </Button>

          {edit ? (
            <Button variant="primary" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          ) : null}
        </div>
      </div>

      {edit ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Input value={form.fullName} onChange={(v) => set("fullName", v)} placeholder="Full name" />
          <Input value={form.email} onChange={(v) => set("email", v)} placeholder="Email" />
          <Input value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} placeholder="YYYY-MM-DD" />
          <Input value={form.address} onChange={(v) => set("address", v)} placeholder="Address" />

          <Input value={form.insuranceProvider} onChange={(v) => set("insuranceProvider", v)} placeholder="Insurance Provider" />
          <Input value={form.insuranceId} onChange={(v) => set("insuranceId", v)} placeholder="Insurance ID" />

          <Input value={form.emergencyContactName} onChange={(v) => set("emergencyContactName", v)} placeholder="Emergency Contact Name" />
          <Input value={form.emergencyContactPhone} onChange={(v) => set("emergencyContactPhone", v)} placeholder="Emergency Contact Phone" />

          <Input value={form.preferredLanguage} onChange={(v) => set("preferredLanguage", v)} placeholder="Preferred Language" />
          <Input value={String(form.preferredLocationId || "")} onChange={(v) => set("preferredLocationId", v ? Number(v) : 0)} placeholder="Preferred Location ID" />
          <Input value={String(form.preferredDoctorId || "")} onChange={(v) => set("preferredDoctorId", v ? Number(v) : 0)} placeholder="Preferred Doctor ID" />

          <div className="sm:col-span-2 lg:col-span-3">
            <Input value={form.notes} onChange={(v) => set("notes", v)} placeholder="Notes" />
          </div>
        </div>
      ) : null}
    </Card>
  );
}