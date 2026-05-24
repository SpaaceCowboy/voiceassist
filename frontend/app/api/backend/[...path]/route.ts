import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.BACKEND_BASE_URL?.replace(/\/$/, "");
const TOKEN_COOKIE = "auth-token";

const PUBLIC_PROXY_ROUTES = new Set([
  "auth/login",
  "auth/setup",
  "auth/register",
]);

function isPublicProxyPath(parts: string[]): boolean {
  return PUBLIC_PROXY_ROUTES.has(parts.join("/"));
}

function isLoginPath(parts: string[]): boolean {
  return parts.join("/") === "auth/login";
}

function isLogoutPath(parts: string[]): boolean {
  return parts.join("/") === "auth/logout";
}

function buildForwardHeaders(req: NextRequest, token: string | undefined): Headers {
  const headers = new Headers();

  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

  if (token) headers.set("authorization", `Bearer ${token}`);

  return headers;
}

function buildResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();

  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const cacheControl = upstream.headers.get("cache-control");
  if (cacheControl) headers.set("cache-control", cacheControl);

  return headers;
}

type JsonObject = Record<string, unknown>;

function readTokenFromLoginPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as JsonObject;
  const data = root.data && typeof root.data === "object"
    ? (root.data as JsonObject)
    : null;

  const token =
    (typeof root.token === "string" ? root.token : null) ??
    (data && typeof data.token === "string" ? data.token : null);

  return token && token.trim() ? token.trim() : null;
}

function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

function clearAuthCookie(res: NextResponse): void {
  res.cookies.set(TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

async function handler(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ path: string[] }> },
) {
  try {
    const params = await paramsPromise;

    if (!BASE) {
      return NextResponse.json(
        { error: "BACKEND_BASE_URL not set" },
        { status: 500 },
      );
    }

    const parts = params.path ?? [];

    // Do not expose debug environment info through the proxy.
    if (parts[0] === "__whoami") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const cookieToken = req.cookies.get(TOKEN_COOKIE)?.value;

    if (!isPublicProxyPath(parts) && !cookieToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const target = new URL(`${BASE}/${parts.join("/")}`);
    req.nextUrl.searchParams.forEach((v, k) => target.searchParams.set(k, v));

    const method = req.method.toUpperCase();
    const headers = buildForwardHeaders(req, cookieToken);
    const body = ["GET", "HEAD"].includes(method)
      ? undefined
      : await req.arrayBuffer();

    const upstream = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const outHeaders = buildResponseHeaders(upstream);

    // Login needs special handling so the browser receives a secure HttpOnly cookie.
    if (isLoginPath(parts)) {
      const contentType = upstream.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const json = await upstream.json().catch(() => null);
        const res = NextResponse.json(json, {
          status: upstream.status,
          headers: outHeaders,
        });

        if (upstream.ok) {
          const token = readTokenFromLoginPayload(json);
          if (token) setAuthCookie(res, token);
        }

        return res;
      }
    }

    if (isLogoutPath(parts)) {
      const res = new NextResponse(upstream.body, {
        status: upstream.status,
        headers: outHeaders,
      });
      clearAuthCookie(res);
      return res;
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: outHeaders,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "Proxy error", details: msg },
      { status: 502 },
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
