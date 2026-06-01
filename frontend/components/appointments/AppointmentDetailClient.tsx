// Path: components/appointments/AppointmentDetailClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { Field, FieldGrid, Avatar } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorCard } from "@/components/ui/ErrorCard";
import {
  CalendarIcon,
  ClockIcon,
  RefreshIcon,
  TrashIcon,
  PhoneIcon,
  StethoscopeIcon,
  CheckCircleIcon,
} from "@/components/ui/icons";
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

/** Read the first non-empty value among candidate keys (handles snake/camel + name suffix variants). */
function pick(a: Appointment, ...keys: string[]): string | null {
  const obj = a as unknown as Record<string, unknown>;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return null;
}

function humanize(v: string | null): string | null {
  if (!v) return v;
  return v.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function splitDateTime(iso: string | null): { date: string | null; time: string | null } {
  if (!iso) return { date: null, time: null };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: null };
  return {
    date: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

function fmtTimestamp(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function appointmentStatus(a: Appointment): AppointmentStatus {
  const s = pick(a, "status") ?? "scheduled";
  return APPOINTMENT_STATUSES.includes(s as AppointmentStatus)
    ? (s as AppointmentStatus)
    : "scheduled";
}

function mergeAppointment(prev: Appointment, next: Appointment): Appointment {
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
      const res = await updateAppointment(idNorm, { status } as Partial<Appointment>);
      setAppt((prev) => (prev ? mergeAppointment(prev, res.data) : res.data));
      setStatus(appointmentStatus(res.data));
      setNote("Status saved.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function cancelAppointment(): Promise<void> {
    if (!idNorm) return;
    if (!confirm("Cancel this appointment?")) return;
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

  const currentStatus = appt ? appointmentStatus(appt) : status;
  const dirty = appt != null && status !== currentStatus;

  // Derived display values
  const patientName = appt ? pick(appt, "patient_name", "patientName") ?? "Unknown patient" : "";
  const patientId = appt ? pick(appt, "patient_id", "patientId") : null;
  const phone = appt ? pick(appt, "patient_phone", "patientPhone", "phone") : null;
  const provider = appt ? humanize(pick(appt, "provider", "provider_name", "doctor_name")) : null;
  const department = appt ? humanize(pick(appt, "department", "department_name")) : null;
  const type = appt ? humanize(pick(appt, "type", "appointment_type")) : null;
  const reason = appt ? pick(appt, "reason", "reason_for_visit") : null;
  const duration = appt ? pick(appt, "duration_minutes") : null;
  const source = appt ? humanize(pick(appt, "created_via", "source")) : null;
  const confirmation = appt ? pick(appt, "confirmation_code") : null;
  const callSid = appt ? pick(appt, "call_sid", "callSid") : null;
  const { date, time } = splitDateTime(appt ? pick(appt, "scheduled_time", "scheduledTime", "date") : null);
  const created = fmtTimestamp(appt ? pick(appt, "created_at") : null);
  const updated = fmtTimestamp(appt ? pick(appt, "updated_at") : null);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<CalendarIcon />}
        backHref="/appointments"
        title={`Appointment #${idNorm ?? "—"}`}
        badge={appt ? <StatusPill value={currentStatus} /> : null}
        subtitle="Review the booking details and update its status."
        actions={
          <>
            <Button
              variant="outline"
              icon={<RefreshIcon size={16} />}
              onClick={() => idNorm && void load(idNorm)}
              disabled={!idNorm || loading}
            >
              Refresh
            </Button>
            <Button
              variant="danger"
              icon={<TrashIcon size={16} />}
              onClick={cancelAppointment}
              disabled={!idNorm || cancelling || loading}
            >
              {cancelling ? "Cancelling…" : "Cancel"}
            </Button>
          </>
        }
      />

      {err ? <ErrorCard message={err} /> : null}
      {note ? (
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
          style={{
            background: "rgba(16,185,129,0.10)",
            borderColor: "rgba(16,185,129,0.30)",
            color: "rgb(5,150,105)",
          }}
        >
          <CheckCircleIcon size={16} /> {note}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Skeleton className="h-28" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : appt ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Left: patient + details */}
          <div className="space-y-5 lg:col-span-2">
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <Avatar name={patientName} />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "rgb(var(--muted))" }}>
                    Patient
                  </div>
                  <div className="truncate text-xl font-semibold">{patientName}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
                    {phone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <PhoneIcon size={14} /> {phone}
                      </span>
                    ) : null}
                    {provider ? (
                      <span className="inline-flex items-center gap-1.5">
                        <StethoscopeIcon size={14} /> {provider}
                      </span>
                    ) : null}
                  </div>
                </div>
                {patientId ? (
                  <Button variant="outline" size="sm" href={`/patients/${patientId}`}>
                    View patient
                  </Button>
                ) : null}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <ClockIcon size={18} className="opacity-60" />
                <h2 className="font-semibold">Schedule &amp; details</h2>
              </div>
              <FieldGrid cols={3}>
                <Field label="Date" value={date} icon={<CalendarIcon size={13} />} />
                <Field label="Time" value={time} icon={<ClockIcon size={13} />} />
                <Field label="Duration" value={duration ? `${duration} min` : null} />
                <Field label="Type" value={type} />
                <Field label="Provider" value={provider} />
                <Field label="Department" value={department} />
                <Field label="Confirmation code" value={confirmation} mono />
                <Field label="Booked via" value={source} />
                <Field label="Call SID" value={callSid} mono />
                <Field label="Reason for visit" value={reason} className="sm:col-span-2 lg:col-span-3" />
              </FieldGrid>
            </Card>
          </div>

          {/* Right: status + meta */}
          <div className="space-y-5">
            <Card className="p-5">
              <h2 className="font-semibold">Update status</h2>
              <p className="mt-0.5 text-sm" style={{ color: "rgb(var(--muted))" }}>
                Changes apply immediately.
              </p>

              <div className="mt-4 flex items-center justify-between rounded-xl border p-3"
                style={{ background: "rgb(var(--surface2))", borderColor: "rgb(var(--border))" }}>
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "rgb(var(--muted))" }}>
                  Current
                </span>
                <StatusPill value={currentStatus} />
              </div>

              <label className="mt-4 block text-xs font-medium uppercase tracking-wide" style={{ color: "rgb(var(--muted))" }}>
                New status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="mt-1.5 w-full rounded-xl border px-3 py-2 text-sm"
                style={{
                  background: "rgb(var(--surface2))",
                  borderColor: "rgb(var(--border))",
                  color: "rgb(var(--text))",
                }}
                disabled={saving || cancelling}
              >
                {APPOINTMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {humanize(s)}
                  </option>
                ))}
              </select>

              <Button
                className="mt-4"
                fullWidth
                variant="primary"
                icon={<CheckCircleIcon size={16} />}
                onClick={saveStatus}
                disabled={saving || cancelling || !dirty}
              >
                {saving ? "Saving…" : dirty ? "Save changes" : "No changes"}
              </Button>
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Record</h2>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt style={{ color: "rgb(var(--muted))" }}>Appointment ID</dt>
                  <dd className="font-mono">{idNorm}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt style={{ color: "rgb(var(--muted))" }}>Created</dt>
                  <dd className="text-right">{created ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt style={{ color: "rgb(var(--muted))" }}>Last updated</dt>
                  <dd className="text-right">{updated ?? "—"}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-10 text-center">
          <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            Appointment not found.
          </div>
        </Card>
      )}
    </div>
  );
}
