// Path: components/patients/details/PatientProfileCard.tsx
"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field, FieldGrid, Avatar } from "@/components/ui/Field";
import { EditIcon, SaveIcon, PhoneIcon, MailIcon, CalendarIcon } from "@/components/ui/icons";
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

/** Labelled input used in edit mode. */
function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide" style={{ color: "rgb(var(--muted))" }}>
        {label}
      </span>
      <Input value={value} onChange={onChange} placeholder={placeholder} className="w-full" />
    </label>
  );
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
      insuranceProvider: r(p, "insuranceProvider") || r(p, "insurance_provider"),
      insuranceId: r(p, "insuranceId") || r(p, "insurance_id"),
      emergencyContactName: r(p, "emergencyContactName") || r(p, "emergency_contact_name"),
      emergencyContactPhone: r(p, "emergencyContactPhone") || r(p, "emergency_contact_phone"),
      preferredLanguage: r(p, "preferredLanguage") || r(p, "preferred_language"),
      preferredLocationId: rNum(p, "preferredLocationId"),
      preferredDoctorId: rNum(p, "preferredDoctorId"),
      notes: r(p, "notes"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patient],
  );

  const phone = r(p, "phone") || r(p, "phone_number");
  const mrn = r(p, "medical_record_number") || r(p, "medicalRecordNumber");

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
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={initial.fullName || "?"} size={56} />
          <div className="min-w-0">
            <div className="truncate text-xl font-semibold">{initial.fullName || "Unnamed patient"}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
              {phone ? (
                <span className="inline-flex items-center gap-1.5">
                  <PhoneIcon size={14} /> {phone}
                </span>
              ) : null}
              {initial.email ? (
                <span className="inline-flex items-center gap-1.5">
                  <MailIcon size={14} /> {initial.email}
                </span>
              ) : null}
              {initial.dateOfBirth ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon size={14} /> {initial.dateOfBirth}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={edit ? "ghost" : "outline"}
            icon={edit ? undefined : <EditIcon size={16} />}
            onClick={() => {
              setForm(initial);
              setEdit((v) => !v);
            }}
          >
            {edit ? "Cancel" : "Edit"}
          </Button>
          {edit ? (
            <Button variant="primary" icon={<SaveIcon size={16} />} onClick={submit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        {edit ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <LabeledInput label="Full name" value={form.fullName} onChange={(v) => set("fullName", v)} placeholder="Jane Doe" />
            <LabeledInput label="Email" value={form.email} onChange={(v) => set("email", v)} placeholder="jane@example.com" />
            <LabeledInput label="Date of birth" value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} placeholder="YYYY-MM-DD" />
            <LabeledInput label="Address" value={form.address} onChange={(v) => set("address", v)} placeholder="Street, City" />
            <LabeledInput label="Insurance provider" value={form.insuranceProvider} onChange={(v) => set("insuranceProvider", v)} />
            <LabeledInput label="Insurance ID" value={form.insuranceId} onChange={(v) => set("insuranceId", v)} />
            <LabeledInput label="Emergency contact" value={form.emergencyContactName} onChange={(v) => set("emergencyContactName", v)} />
            <LabeledInput label="Emergency phone" value={form.emergencyContactPhone} onChange={(v) => set("emergencyContactPhone", v)} />
            <LabeledInput label="Preferred language" value={form.preferredLanguage} onChange={(v) => set("preferredLanguage", v)} />
            <LabeledInput label="Preferred location ID" value={String(form.preferredLocationId || "")} onChange={(v) => set("preferredLocationId", v ? Number(v) : 0)} />
            <LabeledInput label="Preferred doctor ID" value={String(form.preferredDoctorId || "")} onChange={(v) => set("preferredDoctorId", v ? Number(v) : 0)} />
            <LabeledInput label="Notes" value={form.notes} onChange={(v) => set("notes", v)} full />
          </div>
        ) : (
          <FieldGrid cols={3}>
            <Field label="Email" value={initial.email} icon={<MailIcon size={13} />} />
            <Field label="Date of birth" value={initial.dateOfBirth} icon={<CalendarIcon size={13} />} />
            <Field label="Medical record #" value={mrn} mono />
            <Field label="Address" value={initial.address} />
            <Field label="Insurance provider" value={initial.insuranceProvider} />
            <Field label="Insurance ID" value={initial.insuranceId} mono />
            <Field label="Emergency contact" value={initial.emergencyContactName} />
            <Field label="Emergency phone" value={initial.emergencyContactPhone} />
            <Field label="Preferred language" value={initial.preferredLanguage} />
            <Field label="Notes" value={initial.notes} className="sm:col-span-2 lg:col-span-3" />
          </FieldGrid>
        )}
      </div>
    </Card>
  );
}
