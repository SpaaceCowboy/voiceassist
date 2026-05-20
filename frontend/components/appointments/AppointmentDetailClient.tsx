// Path: components/appointments/AppointmentDetailClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonText } from "@/components/ui/Skeleton";
import { ErrorCard } from "@/components/ui/ErrorCard";
import {
  getAppointment,
  updateAppointment,
  deleteAppointment,
} from "@/lib/api/voiceAssistantApi";
import type { Appointment } from "@/lib/types";
import {
  APPOINTMENT_STATUSES,
  type AppointmentStatus,
} from "@/lib/appointments";

type ApiOne<T> = { success: boolean; data: T };

function normalizeIntId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return String(n);
}

function readString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function field(a: Appointment, key: string): string {
  const obj = a as unknown as Record<string, unknown>;
  return readString(obj, key) ?? "—";
}

function appointmentStatus(a: Appointment): AppointmentStatus {
  const obj = a as unknown as Record<string, unknown>;
  const s = readString(obj, "status") ?? "scheduled";
  return APPOINTMENT_STATUSES.includes(s as AppointmentStatus)
    ? (s as AppointmentStatus)
    : "scheduled";
}

function mergeAppointment(prev: Appointment, next: Appointment): Appointment {
  // Many PATCH endpoints return partial objects. Merge to preserve patient_name, etc.
  const p = prev as unknown as Record<string, unknown>;
  const n = next as unknown as Record<string, unknown>;
  return { ...(p as object), ...(n as object) } as Appointment;
}

export default function AppointmentDetailClient() {
  const router = useRouter();
  const params = useParams();

  const rawId = useMemo(() => {
    const v = params?.id;
    return Array.isArray(v) ? v[0] : v;
  }, [params]);

  const idNorm = useMemo(() => normalizeIntId(rawId), [rawId]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [appt, setAppt] = useState<Appointment | null>(null);
  const [status, setStatus] = useState<AppointmentStatus>("scheduled");

  async function load(validId: string): Promise<void> {
    setLoading(true);
    setErr(null);
    setNote(null);
    try {
      const res: ApiOne<Appointment> = await getAppointment(validId);
      setAppt(res.data);
      setStatus(appointmentStatus(res.data));
    } catch (e: unknown) {
      setAppt(null);
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!idNorm) {
      setLoading(false);
      setAppt(null);
      setErr(`Invalid appointment ID in URL. Raw: ${String(rawId ?? "null")}`);
      return;
    }
    void load(idNorm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idNorm]);

  async function saveStatus(): Promise<void> {
    if (!idNorm || !appt) return;
    setSaving(true);
    setErr(null);
    setNote(null);

    try {
      const res = await updateAppointment(idNorm, {
        status,
      } as Partial<Appointment>);

      setAppt((prev) => (prev ? mergeAppointment(prev, res.data) : res.data));
      setStatus(appointmentStatus(res.data));
      setNote("Saved.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function cancelAppointment(): Promise<void> {
    if (!idNorm) return;
    const ok = confirm("Cancel this appointment?");
    if (!ok) return;

    setCancelling(true);
    setErr(null);
    setNote(null);

    try {
      await deleteAppointment(idNorm);
      router.push("/appointments");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Appointment #{idNorm ?? "—"}</h1>
          <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            Review details and update status.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push("/appointments")}>
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={() => idNorm && void load(idNorm)}
            disabled={!idNorm || loading}
          >
            Refresh
          </Button>
          <Button
            variant="danger"
            onClick={cancelAppointment}
            disabled={!idNorm || cancelling || loading}
          >
            {cancelling ? "Cancelling…" : "Cancel"}
          </Button>
        </div>
      </div>

      {err ? <ErrorCard message={err} /> : null}
      {note ? (
        <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          {note}
        </div>
      ) : null}

      {loading ? (
        <Card className="p-4">
          <SkeletonText lines={6} />
        </Card>
      ) : appt ? (
        <>
          {/* Summary card */}
          <Card className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                  Patient
                </div>
                <div className="text-lg font-semibold">
                  {field(appt, "patient_name")}
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: "rgb(var(--muted))" }}
                >
                  Provider: {field(appt, "provider_name")} • Department:{" "}
                  {field(appt, "department")}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div>
                  <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                    Date
                  </div>
                  <div className="font-medium">{field(appt, "date")}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                    Time
                  </div>
                  <div className="font-medium">{field(appt, "time")}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                    Status
                  </div>
                  <div className="font-medium">{field(appt, "status")}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                    ID
                  </div>
                  <div className="font-medium">{idNorm}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Update status card */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Update status</div>
                <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                  Changes apply immediately.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                  className="px-3 py-2 rounded-xl border text-sm"
                  style={{
                    background: "rgb(var(--surface2))",
                    borderColor: "rgb(var(--border))",
                    color: "rgb(var(--text))",
                    minWidth: 170,
                  }}
                  disabled={saving || cancelling}
                >
                  {APPOINTMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <Button
                  variant="primary"
                  onClick={saveStatus}
                  disabled={saving || cancelling}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-4">
          <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            Not found.
          </div>
        </Card>
      )}
    </div>
  );
}
