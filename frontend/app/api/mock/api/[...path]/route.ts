import { NextRequest, NextResponse } from "next/server";
import {
  createFaq,
  deleteFaq,
  deleteReservation,
  getCallBySid,
  getCustomerById,
  getHourly,
  getIntents,
  getOverview,
  getReservationById,
  listCalls,
  listFaqs,
  listReservations,
  patchFaq,
  patchReservation,
  searchCustomers,
} from "@/lib/mock-data";

type Ctx = { params: Promise<{ path: string[] }> };

function notFound() {
  return NextResponse.json({ error: "Mock endpoint not found" }, { status: 404 });
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;

  if (path.length === 1 && path[0] === "health") {
    return NextResponse.json({ ok: true, source: "mock" });
  }

  if (path.length === 1 && path[0] === "reservations") {
    return NextResponse.json(listReservations());
  }

  if (path.length === 2 && path[0] === "reservations") {
    const reservation = getReservationById(path[1]);
    if (!reservation) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    return NextResponse.json(reservation);
  }

  if (path.length === 1 && path[0] === "calls") {
    return NextResponse.json(listCalls());
  }

  if (path.length === 2 && path[0] === "calls") {
    const call = getCallBySid(path[1]);
    if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
    return NextResponse.json(call);
  }

  if (path.length === 2 && path[0] === "customers" && path[1] === "search") {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    return NextResponse.json(searchCustomers(q));
  }

  if (path.length === 2 && path[0] === "customers") {
    const customer = getCustomerById(path[1]);
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json(customer);
  }

  if (path.length === 2 && path[0] === "analytics" && path[1] === "overview") {
    return NextResponse.json(getOverview());
  }

  if (path.length === 2 && path[0] === "analytics" && path[1] === "intents") {
    return NextResponse.json(getIntents());
  }

  if (path.length === 2 && path[0] === "analytics" && path[1] === "hourly") {
    return NextResponse.json(getHourly());
  }

  if (path.length === 1 && path[0] === "faqs") {
    return NextResponse.json(listFaqs());
  }

  return notFound();
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  if (path.length === 1 && path[0] === "faqs") {
    const payload = await req.json().catch(() => ({}));
    const created = createFaq(payload);
    return NextResponse.json(created, { status: 201 });
  }
  return notFound();
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const payload = await req.json().catch(() => ({}));

  if (path.length === 2 && path[0] === "reservations") {
    const updated = patchReservation(path[1], payload);
    if (!updated) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  if (path.length === 2 && path[0] === "faqs") {
    const updated = patchFaq(path[1], payload);
    if (!updated) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  return notFound();
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;

  if (path.length === 2 && path[0] === "reservations") {
    const ok = deleteReservation(path[1]);
    if (!ok) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  }

  if (path.length === 2 && path[0] === "faqs") {
    const ok = deleteFaq(path[1]);
    if (!ok) return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  }

  return notFound();
}
