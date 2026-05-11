import { NextRequest, NextResponse } from "next/server";
import { createFaq, deleteFaq, listFaqs, patchFaq } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(listFaqs());
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}));
  const created = createFaq(payload);
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const payload = await req.json().catch(() => ({}));
  const id = payload?.id;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updated = patchFaq(id, payload);
  if (!updated) {
    return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const fromQuery = req.nextUrl.searchParams.get("id");
  const payload = await req.json().catch(() => ({}));
  const id = fromQuery ?? payload?.id;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const ok = deleteFaq(id);
  if (!ok) {
    return NextResponse.json({ error: "FAQ not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
