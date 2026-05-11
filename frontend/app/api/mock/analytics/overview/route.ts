import { NextResponse } from "next/server";
import { getOverview } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(getOverview());
}
