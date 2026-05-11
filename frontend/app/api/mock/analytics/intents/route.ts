import { NextResponse } from "next/server";
import { getIntents } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(getIntents());
}
