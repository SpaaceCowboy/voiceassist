import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.BACKEND_BASE_URL?.replace(/\/$/, "");

async function handler(
  req: NextRequest,
  // The compiler in your specific Next.js version requires the 'params' object to be a Promise.
  // We will now handle it as a Promise and 'await' it.
  { params: paramsPromise }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await the promise to get the actual params object
    const params = await paramsPromise;

    if (!BASE) return NextResponse.json({ error: "BACKEND_BASE_URL not set" }, { status: 500 });

    const parts = params.path ?? [];
    const target = new URL(`${BASE}/${parts.join("/")}`);

    if ((params.path?.[0] ?? "") === "__whoami") {
      return NextResponse.json({
        BACKEND_BASE_URL: BASE,
        forwardedPath: (params.path ?? []).join("/"),
        forwardedUrl: target.toString(),
      });
    }
    req.nextUrl.searchParams.forEach((v, k) => target.searchParams.set(k, v));

    const method = req.method.toUpperCase();
    const headers = new Headers(req.headers);
    headers.delete("host");
    headers.delete("connection");
    headers.delete("content-length");

    // Important: forward raw body
    const body = ["GET", "HEAD"].includes(method) ? undefined : await req.arrayBuffer();

    const upstream = await fetch(target, { method, headers, body, cache: "no-store" });

    const outHeaders = new Headers(upstream.headers);
    outHeaders.delete("content-encoding");

    return new NextResponse(upstream.body, { status: upstream.status, headers: outHeaders });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // return NextResponse.json({ error: "Proxy error", details: msg }, { status: 500 });
    return NextResponse.json({ PROXY_FILE: "app/api/backend/[...path]/route.ts", ok: true, error: msg });
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
