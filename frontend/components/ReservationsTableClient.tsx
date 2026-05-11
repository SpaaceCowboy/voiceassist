"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/statusPill";
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

export function ReservationsTableClient({ rows }: { rows: ReservationLike[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => {
      const hay = [
        pickReservationId(r),
        pickReservationDatetime(r),
        pickCustomerName(r),
        pickCustomerPhone(r) ?? "",
        pickDepartment(r),
        pickDoctor(r),
        pickStatus(r),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(t);
    });
  }, [q, rows]);

  return (
    <div className="space-y-3">
      <Card className="p-3 flex items-center gap-2">
        <Input
          value={q}
          onChange={setQ}
          placeholder="Search reservations…"
          className="w-80"
        />
        <div className="text-xs" style={{ color: `rgb(var(--muted))` }}>
          {filtered.length}/{rows.length}
        </div>
      </Card>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: `rgb(var(--surface))`,
          borderColor: `rgb(var(--border))`,
        }}
      >
        <table className="w-full text-sm">
          <thead style={{ background: `rgb(var(--surface2))` }}>
            <tr>
              <th className="text-left p-3">Date/Time</th>
              <th className="text-left p-3">Customer</th>
              <th className="text-left p-3">Department</th>
              <th className="text-left p-3">Doctor</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const id = pickReservationId(r);
              return (
                <tr
                  key={id}
                  className="border-t border-black/5 dark:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                >
                  <td className="p-3">
                    <Link
                      className="underline underline-offset-2"
                      href={`/reservations/${id}`}
                    >
                      {pickReservationDatetime(r)}
                    </Link>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{pickCustomerName(r)}</div>
                    {pickCustomerPhone(r) ? (
                      <div
                        className="text-xs"
                        style={{ color: `rgb(var(--muted))` }}
                      >
                        {pickCustomerPhone(r)}
                      </div>
                    ) : null}
                  </td>
                  <td className="p-3">{pickDepartment(r)}</td>
                  <td className="p-3">{pickDoctor(r)}</td>
                  <td className="p-3">
                    <StatusPill value={pickStatus(r)} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-sm"
                  style={{ color: `rgb(var(--muted))` }}
                >
                  No matches.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
