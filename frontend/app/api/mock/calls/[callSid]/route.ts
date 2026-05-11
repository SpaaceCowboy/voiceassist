import { NextResponse } from "next/server";
import { getCallBySid } from "@/lib/mock-data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ callSid: string }> },
) {
  const { callSid } = await params;
  const call = getCallBySid(callSid);

  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  return NextResponse.json(call);
}
