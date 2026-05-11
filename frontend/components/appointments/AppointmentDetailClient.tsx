"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonText } from "@/components/ui/Skeleton";
import {
  getAppointment,
  updateAppointment,
  deleteAppointment,
} from "@/lib/api/voiceAssistantApi";
import type { Appointment } from "@/lib/types";
import { useRouter } from "next/navigation";

type ApiOne<T> = { success: boolean; data: T };

function pickField(a: Appointment, key: string): string {
  const obj = a as unknown as Record<string, unknown>;
  const v = obj[key];
  return v == null ? "—" : String(v);
}

export default function AppointmentDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [status, setStatus] = useState<string>("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res: ApiOne<Appointment> = await getAppointment(id);
      setAppt(res.data);
      const s = (res.data as unknown as { status?: string }).status ?? "";
      setStatus(String(s));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
      setAppt(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveStatus() {
    if (!appt) return;
    setErr(null);
    try {
      const res = await updateAppointment(id, {
        status,
      } as Partial<Appointment>);
      setAppt(res.data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function cancelAppointment() {
    const ok = confirm("Cancel this appointment?");
    if (!ok) return;

    setErr(null);
    try {
      await deleteAppointment(id);
      router.push("/appointments");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Appointment #{id}</h1>
        <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Details and actions.
        </p>
      </div>

      {err ? (
        <Card className="p-3 border-[rgba(239,68,68,0.35)]">
          <div className="text-sm" style={{ color: "rgb(239,68,68)" }}>
            {err}
          </div>
        </Card>
      ) : null}

      {loading ? (
        <Card className="p-4">
          <SkeletonText lines={5} />
        </Card>
      ) : appt ? (
        <>
          <Card className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                Date
              </div>
              <div>{pickField(appt, "date")}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                Time
              </div>
              <div>{pickField(appt, "time")}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                Status
              </div>
              <div>{pickField(appt, "status")}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                Patient
              </div>
              <div>{pickField(appt, "patient_name")}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                Department
              </div>
              <div>{pickField(appt, "department")}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                Provider
              </div>
              <div>{pickField(appt, "provider_name")}</div>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="font-semibold">Update Status</div>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border text-sm"
                style={{
                  background: "rgb(var(--surface2))",
                  borderColor: "rgb(var(--border))",
                  color: "rgb(var(--text))",
                }}
                placeholder="e.g., confirmed"
              />
              <Button variant="primary" onClick={saveStatus}>
                Save
              </Button>
              <Button variant="danger" onClick={cancelAppointment}>
                Cancel Appointment
              </Button>
              <Button variant="ghost" onClick={load}>
                Refresh
              </Button>
            </div>
            <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
              (We’ll convert status input to dropdown later.)
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
