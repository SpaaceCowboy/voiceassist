import { NextResponse } from "next/server";
import { listCalls } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(listCalls());
}
