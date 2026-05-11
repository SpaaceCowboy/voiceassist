export type ReservationLike = Record<string, unknown>;

export function pickReservationId(r: ReservationLike): string {
  return String(r.id ?? r.reservation_id ?? r.reservationId ?? r.uuid ?? "");
}

export function pickReservationDatetime(r: ReservationLike): string {
  // Prefer full datetime, then date+time
  const dt =
    r.datetime ??
    r.date_time ??
    r.dateTime ??
    r.start_time ??
    r.startTime ??
    null;

  if (dt) return String(dt);

  const d = r.date ?? r.day ?? null;
  const t = r.time ?? r.start ?? null;

  const s = `${d ?? ""} ${t ?? ""}`.trim();
  return s || "—";
}

export function pickCustomerName(r: ReservationLike): string {
  return String(
    r.customer_name ??
    r.customerName ??
    r.name ??
    r.full_name ??
    r.fullName ??
    "—"
  );
}

export function pickCustomerPhone(r: ReservationLike): string | null {
  const p =
    r.customer_phone ??
    r.customerPhone ??
    r.phone ??
    r.phone_number ??
    r.phoneNumber ??
    null;
  return p ? String(p) : null;
}

export function pickDepartment(r: ReservationLike): string {
  return String(r.department ?? r.specialty ?? r.service ?? "—");
}

export function pickDoctor(r: ReservationLike): string {
  return String(r.doctor ?? r.provider ?? r.provider_name ?? r.providerName ?? "—");
}

export function pickStatus(r: ReservationLike): string {
  return String(r.status ?? r.state ?? "—");
}