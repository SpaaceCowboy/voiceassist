"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { searchPatients } from "@/lib/api/voiceAssistantApi";
import type { Patient } from "@/lib/types";

type ApiList<T> = { success: boolean; data: T[]; count: number };

function pickId(p: Patient): string {
  const obj = p as unknown as Record<string, unknown>;
  return String(obj.id ?? obj.patient_id ?? "");
}
function pickName(p: Patient): string {
  const obj = p as unknown as Record<string, unknown>;
  return String(obj.full_name ?? obj.name ?? obj.first_name ?? "—");
}
function pickPhone(p: Patient): string {
  const obj = p as unknown as Record<string, unknown>;
  return String(obj.phone ?? obj.phone_number ?? "—");
}
function pickDob(p: Patient): string {
  const obj = p as unknown as Record<string, unknown>;
  return String(obj.dob ?? obj.date_of_birth ?? "—");
}

export default function PatientsPageClient() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Patient[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const res: ApiList<Patient> = await searchPatients({
        q: q.trim() || undefined,
        limit: 25,
        offset: 0,
      });
      setRows(res.data);
      setCount(res.count);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
      setRows([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Patients</h1>
        <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Search patients and open profile with appointment history.
        </p>
      </div>

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <Input
          value={q}
          onChange={setQ}
          placeholder="Search by name, phone, or keyword…"
          className="w-80"
        />
        <Button variant="primary" onClick={run} disabled={loading}>
          {loading ? "Loading…" : q.trim() ? "Search" : "Refresh"}
        </Button>
        <div className="text-xs ml-auto" style={{ color: "rgb(var(--muted))" }}>
          {rows.length} results • total {count}
        </div>
      </Card>

      {err ? (
        <Card className="p-3 border-[rgba(239,68,68,0.35)]">
          <div className="text-sm" style={{ color: "rgb(239,68,68)" }}>
            {err}
          </div>
        </Card>
      ) : null}

      {loading ? (
        <SkeletonTable rows={6} />
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "rgb(var(--surface))",
            borderColor: "rgb(var(--border))",
          }}
        >
          <table className="w-full text-sm">
            <thead style={{ background: "rgb(var(--surface2))" }}>
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-left p-3">DOB</th>
                <th className="text-left p-3">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const id = pickId(p);
                return (
                  <tr
                    key={id}
                    className="border-t border-black/5 dark:border-white/10"
                  >
                    <td className="p-3">{pickName(p)}</td>
                    <td className="p-3">{pickPhone(p)}</td>
                    <td className="p-3">{pickDob(p)}</td>
                    <td className="p-3">
                      <Link
                        className="underline underline-offset-2"
                        href={`/patients/${id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-6 text-center text-sm"
                    style={{ color: "rgb(var(--muted))" }}
                  >
                    No results.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
