import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  pickReservationDatetime,
  pickCustomerName,
  pickCustomerPhone,
  pickDepartment,
  pickDoctor,
  pickStatus,
  ReservationLike,
} from "@/lib/reservations";

export const dynamic = "force-dynamic";

async function getReservation(id: string): Promise<ReservationLike> {
  const res = await fetch(`/api/backend/api/reservations/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Reservation fetch failed: ${res.status}`);
  return res.json();
}

function field(label: string, value: unknown) {
  return (
    <div className="text-sm">
      <div className="text-xs mb-1" style={{ color: "rgb(var(--muted))" }}>{label}</div>
      <div>{String(value ?? "—")}</div>
    </div>
  );
}

export default async function ReservationDetailPage({ params }: { params: { id: string } }) {
  const r = await getReservation(params.id);

  const dt = pickReservationDatetime(r);
  const name = pickCustomerName(r);
  const phone = pickCustomerPhone(r);
  const dept = pickDepartment(r);
  const doc = pickDoctor(r);
  const statusVal = pickStatus(r);
  const statusTone =
    statusVal.toLowerCase().includes("cancel") ? "bad" :
    statusVal.toLowerCase().includes("complete") ? "good" :
    statusVal.toLowerCase().includes("no_show") || statusVal.toLowerCase().includes("noshow") ? "warn" : "neutral";

  const notes =
    r.special_requests ??
    r.specialRequests ??
    r.notes ??
    r.note ??
    r.reason ??
    r.problem ??
    "—";

  // Optional link if backend provides it
  const callSid = r.callSid ?? r.call_sid ?? null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={`Reservation #${params.id}`}
          subtitle="Details and notes."
        />
      </Card>

      <Card className="p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {field("Date/Time", dt)}
        {field("Customer", name)}
        {field("Phone", phone ?? "—")}
        {field("Department", dept)}
        {field("Doctor", doc)}
        <div className="text-sm">
          <div className="text-xs mb-1" style={{ color: "rgb(var(--muted))" }}>Status</div>
          <div className="mt-1"><Badge text={statusVal || "—"} tone={statusTone} /></div>
        </div>
        {callSid ? field("CallSid", String(callSid)) : null}
        </div>
      </Card>

      <Card className="p-4">
        <div className="font-semibold">Notes / Special Requests</div>
        <div className="mt-2 text-sm whitespace-pre-wrap" style={{ color: "rgb(var(--muted))" }}>
          {String(notes)}
        </div>
      </Card>

      {/* Actions placeholder — we’ll wire real actions next */}
      <Card className="p-4">
        <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Actions (Update / Cancel) will be added next after we confirm backend PATCH/DELETE behavior.
        </div>
      </Card>
    </div>
  );
}