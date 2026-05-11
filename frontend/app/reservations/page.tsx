"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { ReservationsTableClient } from "@/components/ReservationsTableClient";
import { Badge } from "@/components/ui/Badge";
import { backendGet, BackendError } from "@/lib/backend";
import {
  pickReservationId,
  pickReservationDatetime,
  pickCustomerName,
  pickCustomerPhone,
  pickDepartment,
  pickDoctor,
  pickStatus,
  ReservationLike,
} from "@/lib/reservations";

type ListEnvelope = { data?: ReservationLike[] } | ReservationLike[];

function statusTone(value: string): "good" | "bad" | "warn" | "neutral" {
  const v = (value || "").toLowerCase();
  if (v.includes("cancel")) return "bad";
  if (v.includes("complete")) return "good";
  if (v.includes("no_show") || v.includes("noshow")) return "warn";
  return "neutral";
}

export default function ReservationsPage() {
  const [rows, setRows] = useState<ReservationLike[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await backendGet<ListEnvelope>("/api/appointments");
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        if (!cancelled) setRows(list);
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof BackendError
            ? `Failed to load (${e.status})`
            : e instanceof Error
              ? e.message
              : "Failed to load";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <ReservationsTableClient rows={rows} />
        <CardHeader
          title="Reservations"
          subtitle="View and manage reservations/appointments."
        />
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: "rgb(var(--surface2))" }}>
            <tr>
              <th className="text-left p-3">Date/Time</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Department</th>
              <th className="text-left p-3">Doctor</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const id = pickReservationId(r);
              const dt = pickReservationDatetime(r);
              const name = pickCustomerName(r);
              const phone = pickCustomerPhone(r);
              const dept = pickDepartment(r);
              const doc = pickDoctor(r);
              const status = pickStatus(r);

              return (
                <tr
                  key={id}
                  className="border-t"
                  style={{ borderColor: "rgb(var(--border))" }}
                >
                  <td className="p-3">
                    <Link
                      className="underline underline-offset-2"
                      href={`/reservations/${id}`}
                    >
                      {dt}
                    </Link>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{name}</div>
                    {phone ? (
                      <div
                        className="text-xs"
                        style={{ color: "rgb(var(--muted))" }}
                      >
                        {phone}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3">{dept}</td>
                  <td className="p-3">{doc}</td>
                  <td className="p-3">
                    <Badge text={status || "—"} tone={statusTone(status)} />
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-sm"
                  style={{ color: "rgb(var(--muted))" }}
                >
                  {loading
                    ? "Loading…"
                    : error
                      ? error
                      : "No reservations found."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
