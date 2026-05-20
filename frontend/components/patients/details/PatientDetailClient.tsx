// Path: components/patients/details/PatientDetailClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonText } from "@/components/ui/Skeleton";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { getPatient, updatePatient } from "@/lib/api/voiceAssistantApi";
import type { Patient } from "@/lib/types";
import { PatientProfileCard } from "./PatientProfileCard";
import { PatientHistoryCard } from "./PatientHistoryCard";

type ApiOne<T> = { success: boolean; data: T };

export type PatientPatchPayload = {
  fullName?: string;
  email?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  address?: string;
  insuranceProvider?: string;
  insuranceId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredLanguage?: string;
  preferredLocationId?: number;
  preferredDoctorId?: number;
  notes?: string;
};

type HistoryItem = {
  id: number;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: string;
  status: string;
  reason_for_visit: string | null;
  doctor_name: string | null;
  doctor_title: string | null;
  department_name: string | null;
  location_name: string | null;
  source: string | null;
  confirmation_code: string | null;
};

function normalizeIntId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return String(n);
}

function mergePatient(prev: Patient, next: Patient): Patient {
  const p = prev as unknown as Record<string, unknown>;
  const n = next as unknown as Record<string, unknown>;
  return { ...(p as object), ...(n as object) } as Patient;
}

function mapHistoryFromPatient(patient: Patient): HistoryItem[] {
  const p = patient as unknown as Record<string, unknown>;
  const raw = p["appointments"] ?? p["history"];
  const arr = Array.isArray(raw) ? raw : [];

  return arr
    .filter((x) => typeof x === "object" && x !== null)
    .map((x) => x as Record<string, unknown>)
    .map((x) => ({
      id: Number(x.id),
      appointment_date: String(x.appointment_date ?? ""),
      appointment_time: String(x.appointment_time ?? ""),
      duration_minutes: Number(x.duration_minutes ?? 0),
      appointment_type: String(x.appointment_type ?? ""),
      status: String(x.status ?? ""),
      reason_for_visit:
        x.reason_for_visit == null ? null : String(x.reason_for_visit),
      doctor_name: x.doctor_name == null ? null : String(x.doctor_name),
      doctor_title: x.doctor_title == null ? null : String(x.doctor_title),
      department_name:
        x.department_name == null ? null : String(x.department_name),
      location_name:
        x.location_name == null ? null : String(x.location_name),
      source: x.source == null ? null : String(x.source),
      confirmation_code:
        x.confirmation_code == null ? null : String(x.confirmation_code),
    }))
    .filter((h) => Number.isFinite(h.id) && h.id > 0);
}

export default function PatientDetailClient() {
  const router = useRouter();
  const params = useParams();

  const rawId = useMemo(() => {
    const v = params?.id;
    return Array.isArray(v) ? v[0] : v;
  }, [params]);

  const idNorm = useMemo(() => normalizeIntId(rawId), [rawId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  async function load(validId: string): Promise<void> {
    setLoading(true);
    setErr(null);
    try {
      const res: ApiOne<Patient> = await getPatient(validId);
      setPatient(res.data);
      setNote(null);
    } catch (e: unknown) {
      setPatient(null);
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!idNorm) {
      setLoading(false);
      setPatient(null);
      setErr(`Invalid patient ID in URL. Raw: ${String(rawId ?? "null")}`);
      return;
    }
    void load(idNorm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idNorm]);

  async function onSave(patch: PatientPatchPayload): Promise<void> {
    if (!idNorm || !patient) return;
    setSaving(true);
    setErr(null);
    setNote(null);
    try {
      const res = await updatePatient(
        idNorm,
        patch as unknown as Partial<Patient>,
      );
      setPatient((prev) => (prev ? mergePatient(prev, res.data) : res.data));
      setNote("Saved.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-4">
        <SkeletonText lines={7} />
      </Card>
    );
  }

  if (err) return <ErrorCard message={err} />;

  if (!patient) {
    return (
      <Card className="p-4">
        <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Not found.
        </div>
      </Card>
    );
  }

  const mappedHistory = mapHistoryFromPatient(patient);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Patient #{idNorm ?? "—"}</h1>
          <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            Profile and appointment history.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push("/patients")}>
            Back
          </Button>
          <Button
            variant="primary"
            onClick={() => idNorm && void load(idNorm)}
            disabled={!idNorm}
          >
            Refresh
          </Button>
        </div>
      </div>

      {note ? (
        <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          {note}
        </div>
      ) : null}

      <PatientProfileCard patient={patient} saving={saving} onSave={onSave} />
      <PatientHistoryCard history={mappedHistory} />
    </div>
  );
}
