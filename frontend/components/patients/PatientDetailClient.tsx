"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { SkeletonText } from "@/components/ui/Skeleton";
import { getPatient } from "@/lib/api/voiceAssistantApi";
import type { Patient } from "@/lib/types";

type ApiOne<T> = { success: boolean; data: T };

function getField(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return v == null ? "—" : String(v);
}

export default function PatientDetailClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res: ApiOne<Patient> = await getPatient(id);
        setPatient(res.data);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
        setPatient(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <Card className="p-4">
        <SkeletonText lines={6} />
      </Card>
    );
  }

  if (err) {
    return (
      <Card className="p-4 border-[rgba(239,68,68,0.35)]">
        <div className="text-sm" style={{ color: "rgb(239,68,68)" }}>
          {err}
        </div>
      </Card>
    );
  }

  if (!patient) {
    return (
      <Card className="p-4">
        <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Not found.
        </div>
      </Card>
    );
  }

  const p = patient as unknown as Record<string, unknown>;
  // backend likely includes appointment history array; show it if present
  const history =
    (p.appointments as unknown[]) ?? (p.history as unknown[]) ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Patient #{id}</h1>
        <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Profile and appointment history.
        </p>
      </div>

      <Card className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Name
          </div>
          <div>{getField(p, "full_name")}</div>
        </div>
        <div>
          <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Phone
          </div>
          <div>{getField(p, "phone")}</div>
        </div>
        <div>
          <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            DOB
          </div>
          <div>{getField(p, "dob")}</div>
        </div>
        <div>
          <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Email
          </div>
          <div>{getField(p, "email")}</div>
        </div>
        <div>
          <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Address
          </div>
          <div>{getField(p, "address")}</div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="font-semibold mb-2">Appointment History</div>
        {history.length === 0 ? (
          <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            No history.
          </div>
        ) : (
          <pre className="text-xs bg-black/5 dark:bg-white/10 p-3 rounded-xl overflow-auto">
            {JSON.stringify(history.slice(0, 10), null, 2)}
          </pre>
        )}
        <div className="text-xs mt-2" style={{ color: "rgb(var(--muted))" }}>
          (We’ll replace this JSON preview with a proper table once we confirm
          the exact schema.)
        </div>
      </Card>
    </div>
  );
}
