import { NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

const STATUS_EMAIL =
  process.env.STATUS_CHECK_EMAIL ?? "admin@neurospine.com";
const STATUS_PASSWORD =
  process.env.STATUS_CHECK_PASSWORD ?? "NeuroAdmin2026!";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type CheckResult = {
  name: string;
  method: string;
  path: string;
  ok: boolean;
  status?: number;
  ms: number;
  preview?: JsonValue;
  error?: string;
};

async function check(
  name: string,
  method: string,
  path: string,
  options?: { body?: string; token?: string }
): Promise<CheckResult> {
  const url = `${BACKEND}${path}`;
  const start = Date.now();

  try {
    const headers: Record<string, string> = {};
    if (options?.token) {
      headers["Authorization"] = `Bearer ${options.token}`;
    }
    if (options?.body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: options?.body,
      cache: "no-store",
    });
    const ms = Date.now() - start;

    let preview: JsonValue = null;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const json = await res.json().catch(() => null);
      if (Array.isArray(json))
        preview = {
          type: "array",
          length: json.length,
          sample: json.slice(0, 1),
        };
      else if (json && typeof json === "object") preview = json;
      else preview = json;
    } else {
      const txt = await res.text().catch(() => "");
      preview = txt.slice(0, 300);
    }

    return { name, method, path, ok: res.ok, status: res.status, ms, preview };
  } catch (e: unknown) {
    const ms = Date.now() - start;
    const error = e instanceof Error ? e.message : String(e);
    return { name, method, path, ok: false, ms, error };
  }
}

export async function GET() {
  // 1. Login to get token for protected API checks
  let token: string | undefined;
  const loginRes = await check(
    "Auth Login",
    "POST",
    "/auth/login",
    {
      body: JSON.stringify({ email: STATUS_EMAIL, password: STATUS_PASSWORD }),
    }
  );

  if (loginRes.ok && loginRes.preview && typeof loginRes.preview === "object") {
    const data = loginRes.preview as { data?: { token?: string } };
    token = data?.data?.token;
  }

  // 2. Auth checks (setup returns 403 if already done — that's ok)
  const setupRes = await check(
    "Auth Setup",
    "POST",
    "/auth/setup",
    {
      body: JSON.stringify({
        fullName: "Status Check",
        email: "status@check.local",
        password: "StatusCheck123!",
      }),
    }
  );
  const setupOk = setupRes.ok || setupRes.status === 403;

  // 3. Protected API checks (require token)
  const authHeaders = token ? { token } : undefined;
  const protectedChecks = token
    ? await Promise.all([
        check("Appointments List", "GET", "/api/appointments", authHeaders),
        check("Appointment by ID", "GET", "/api/appointments/1", authHeaders),
        check("Calls List", "GET", "/api/calls", authHeaders),
        check("FAQs List", "GET", "/api/faqs", authHeaders),
        check("FAQ by ID", "GET", "/api/faqs/1", authHeaders),
        check("Analytics Overview", "GET", "/api/analytics/overview", authHeaders),
        check("Analytics Intents", "GET", "/api/analytics/intents", authHeaders),
        check("Analytics Hourly", "GET", "/api/analytics/hourly", authHeaders),
        check("Patient Search", "GET", "/api/patients/search?q=test", authHeaders),
        check("Patient by ID", "GET", "/api/patients/1", authHeaders),
      ])
    : [
        { name: "API (auth required)", method: "GET", path: "/api/*", ok: false, ms: 0, preview: "Login failed — no token" } as CheckResult,
      ];

  const [serverCheck, healthCheck] = await Promise.all([
    check("Server Info", "GET", "/"),
    check("Health", "GET", "/api/health"),
  ]);

  const checks: CheckResult[] = [
    serverCheck,
    healthCheck,
    { ...loginRes, name: "Auth Login" },
    { ...setupRes, name: "Auth Setup", ok: setupOk },
    ...protectedChecks,
  ];

  const okCount = checks.filter((c) => c.ok).length;
  const summary = {
    backend: BACKEND,
    okCount,
    total: checks.length,
    loggedIn: !!token,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({ summary, checks });
}
