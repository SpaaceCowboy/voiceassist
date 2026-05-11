import type {
  AnalyticsOverview,
  CallLogDetail,
  CallLogListItem,
  FaqItem,
  ReservationDetail,
  ReservationListItem,
} from "@/lib/types";

const reservations: ReservationDetail[] = [
  {
    id: "rsv_1001",
    datetime: "2026-02-16T09:30:00Z",
    customer_name: "John Carter",
    customer_phone: "+1-555-0101",
    department: "Orthopedic",
    provider: "Dr. Martinez",
    doctor: "Dr. Martinez",
    reason: "Post-op knee pain follow-up",
    created_via: "ai",
    timezone: "America/Los_Angeles",
    status: "scheduled",
    special_requests: "Needs wheelchair access.",
    callSid: "CA1000001",
    call_sid: "CA1000001",
  },
  {
    id: "rsv_1002",
    datetime: "2026-02-16T11:00:00Z",
    customer_name: "Ava Thompson",
    customer_phone: "+1-555-0102",
    department: "Pain",
    provider: "Any",
    doctor: "Any",
    reason: "Chronic lower-back pain consultation",
    created_via: "staff",
    timezone: "America/Los_Angeles",
    status: "canceled",
    notes: "First-time patient.",
    callSid: "CA1000002",
    call_sid: "CA1000002",
  },
  {
    id: "rsv_1003",
    datetime: "2026-02-16T14:15:00Z",
    customer_name: "Noah Wilson",
    customer_phone: "+1-555-0103",
    department: "Neurology",
    provider: "Dr. Sharma",
    doctor: "Dr. Sharma",
    reason: "Migraine treatment plan review",
    created_via: "ai",
    timezone: "America/Los_Angeles",
    status: "completed",
    notes: "Follow-up in two weeks.",
    callSid: "CA1000003",
    call_sid: "CA1000003",
  },
  {
    id: "rsv_1004",
    datetime: "2026-02-16T16:00:00Z",
    customer_name: "Mia Hernandez",
    customer_phone: "+1-555-0104",
    department: "Orthopedic",
    provider: "Dr. Nguyen",
    doctor: "Dr. Nguyen",
    reason: "Shoulder mobility assessment",
    created_via: "staff",
    timezone: "America/Los_Angeles",
    status: "no_show",
    notes: "Patient did not answer reminder call.",
    callSid: "CA1000004",
    call_sid: "CA1000004",
  },
];

const calls: CallLogDetail[] = [
  {
    callSid: "CA1000001",
    created_at: "2026-02-15T13:10:00Z",
    outcome: "booked",
    intent: "scheduling",
    problem: "new_appointment",
    mood: "neutral",
    duration_seconds: 284,
    tool_calls: [
      {
        name: "check_availability",
        at: "2026-02-15T13:11:03Z",
        status: "ok",
        args: { department: "Orthopedic", provider: "Dr. Martinez" },
      },
      {
        name: "create_reservation",
        at: "2026-02-15T13:12:19Z",
        status: "ok",
        args: { reservationId: "rsv_1001" },
      },
    ],
    transcript:
      "Caller asked for an orthopedic appointment. Appointment booked for Monday at 9:30 AM.",
  },
  {
    callSid: "CA1000002",
    created_at: "2026-02-15T15:47:00Z",
    outcome: "failed",
    intent: "billing",
    problem: "payment_dispute",
    mood: "angry",
    duration_seconds: 198,
    tool_calls: [
      {
        name: "fetch_invoice",
        at: "2026-02-15T15:48:10Z",
        status: "error",
        args: { accountId: "acc_44" },
        result: { message: "Timeout from billing service" },
      },
    ],
    transcript:
      "Caller requested billing clarification. Assistant could not complete lookup due to service timeout.",
  },
  {
    callSid: "CA1000003",
    created_at: "2026-02-15T17:22:00Z",
    outcome: "faq_only",
    intent: "clinical",
    problem: "medication_question",
    mood: "calm",
    duration_seconds: 163,
    tool_calls: [
      {
        name: "search_faq",
        at: "2026-02-15T17:22:44Z",
        status: "ok",
        args: { query: "post-visit medication guidance" },
      },
    ],
    transcript:
      "Caller asked a clinical FAQ about medication timing after visit. Information provided from approved FAQ.",
  },
  {
    callSid: "CA1000004",
    created_at: "2026-02-15T18:03:00Z",
    outcome: "transferred",
    intent: "scheduling",
    problem: "urgent_reschedule",
    mood: "angry",
    duration_seconds: 311,
    transfer_department: "Pain",
    tool_calls: [
      {
        name: "check_availability",
        at: "2026-02-15T18:04:13Z",
        status: "ok",
        args: { department: "Pain" },
      },
      {
        name: "transfer_call",
        at: "2026-02-15T18:06:02Z",
        status: "ok",
        args: { department: "Pain" },
      },
    ],
    transcript:
      "Caller requested urgent reschedule and became upset about delays. Assistant transferred to Pain front desk.",
  },
];

const seedFaqs: FaqItem[] = [
  {
    id: "faq_1",
    question: "What are your support hours?",
    answer: "Support is available Monday to Friday, 9 AM to 6 PM.",
    category: "general",
    active: true,
  },
  {
    id: "faq_2",
    question: "How do I reschedule a reservation?",
    answer: "You can reschedule by calling the assistant and confirming your reservation ID.",
    category: "reservations",
    active: true,
  },
];

let faqs: FaqItem[] = [...seedFaqs];
let faqCounter = seedFaqs.length + 1;

export function listReservations(): ReservationListItem[] {
  return reservations;
}

export function getReservationById(id: string): ReservationDetail | null {
  return reservations.find((r) => String(r.id) === String(id)) ?? null;
}

export function patchReservation(
  id: string,
  input: Partial<ReservationDetail>,
): ReservationDetail | null {
  const index = reservations.findIndex((r) => String(r.id) === String(id));
  if (index < 0) return null;

  const current = reservations[index];
  const updated: ReservationDetail = {
    ...current,
    ...input,
    id: current.id,
  };
  reservations[index] = updated;
  return updated;
}

export function deleteReservation(id: string): boolean {
  const index = reservations.findIndex((r) => String(r.id) === String(id));
  if (index < 0) return false;
  reservations.splice(index, 1);
  return true;
}

export function listCalls(): CallLogListItem[] {
  return calls;
}

export function getCallBySid(callSid: string): CallLogDetail | null {
  return calls.find((c) => c.callSid === callSid) ?? null;
}

export function searchCustomers(query: string) {
  const q = query.trim().toLowerCase();
  const byPhone = (value?: string) => (value || "").replace(/\D/g, "");
  const queryPhone = q.replace(/\D/g, "");

  const map = new Map<string, { id: string; name: string; phone: string; reservations: number }>();

  for (const r of reservations) {
    const id = `cus_${String(r.id)}`;
    const name = r.customer_name || "Unknown";
    const phone = r.customer_phone || "";
    const existing = map.get(id) || { id, name, phone, reservations: 0 };
    existing.reservations += 1;
    map.set(id, existing);
  }

  const all = [...map.values()];
  if (!q) return all;

  return all.filter((c) => {
    const nameMatch = c.name.toLowerCase().includes(q);
    const phoneMatch = queryPhone.length > 0 && byPhone(c.phone).includes(queryPhone);
    return nameMatch || phoneMatch;
  });
}

export function getCustomerById(id: string) {
  const all = searchCustomers("");
  const found = all.find((c) => c.id === id);
  if (!found) return null;

  const history = reservations.filter((r) => `cus_${String(r.id)}` === id);
  return { ...found, history };
}

export function listFaqs(): FaqItem[] {
  return faqs;
}

export function createFaq(input: Partial<FaqItem>): FaqItem {
  const next: FaqItem = {
    id: `faq_${faqCounter++}`,
    question: input.question?.trim() || "Untitled question",
    answer: input.answer?.trim() || "",
    category: input.category?.trim() || "general",
    active: typeof input.active === "boolean" ? input.active : true,
  };
  faqs = [next, ...faqs];
  return next;
}

export function patchFaq(id: string | number, input: Partial<FaqItem>): FaqItem | null {
  const index = faqs.findIndex((f) => String(f.id) === String(id));
  if (index < 0) return null;

  const existing = faqs[index];
  const updated: FaqItem = {
    ...existing,
    ...input,
    id: existing.id,
  };
  faqs[index] = updated;
  return updated;
}

export function deleteFaq(id: string | number): boolean {
  const before = faqs.length;
  faqs = faqs.filter((f) => String(f.id) !== String(id));
  return faqs.length < before;
}

export function getOverview(): AnalyticsOverview {
  return {
    total_calls: calls.length,
    total_reservations: reservations.length,
    transfers: calls.filter((c) => c.outcome === "transferred").length,
    failures: calls.filter((c) => c.outcome === "failed").length,
  };
}

export function getIntents() {
  return [
    { intent: "new_reservation", count: 58 },
    { intent: "reschedule", count: 22 },
    { intent: "cancel", count: 11 },
    { intent: "billing_question", count: 9 },
  ];
}

export function getHourly() {
  return [
    { hour: "08:00", calls: 3 },
    { hour: "09:00", calls: 7 },
    { hour: "10:00", calls: 12 },
    { hour: "11:00", calls: 9 },
    { hour: "12:00", calls: 6 },
    { hour: "13:00", calls: 8 },
    { hour: "14:00", calls: 11 },
    { hour: "15:00", calls: 13 },
    { hour: "16:00", calls: 10 },
    { hour: "17:00", calls: 7 },
  ];
}
