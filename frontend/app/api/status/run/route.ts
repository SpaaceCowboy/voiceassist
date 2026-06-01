import { NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4001";

const STATUS_EMAIL = process.env.STATUS_CHECK_EMAIL;
const STATUS_PASSWORD = process.env.STATUS_CHECK_PASSWORD;

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type Auth = "public" | "user" | "moderator";

type Endpoint = {
  group: string;
  name: string;
  method: string;
  path: string; // may contain :id / :callSid placeholders
  auth: Auth;
  description: string;
  /** Actively call it. Mutating endpoints are catalogued but never hit. */
  probe: boolean;
  /** Resolve a real id from a list before probing a by-id route. */
  sample?: "appointment" | "patient" | "call";
};

export type StatusCheck = {
  group: string;
  name: string;
  method: string;
  path: string;
  auth: Auth;
  description: string;
  probed: boolean;
  ok: boolean;
  status?: number;
  ms?: number;
  empty?: boolean;
  error?: string;
  preview?: JsonValue;
};

// ---- The full API surface ---------------------------------------------------
const CATALOG: Endpoint[] = [
  // System
  { group: "System", name: "Server info", method: "GET", path: "/", auth: "public", probe: true, description: "Root metadata — confirms the API process is up and serving." },
  { group: "System", name: "Health check", method: "GET", path: "/api/health", auth: "public", probe: true, description: "Liveness probe; reports database and Redis connectivity." },

  // Auth
  { group: "Auth", name: "Login", method: "POST", path: "/auth/login", auth: "public", probe: true, description: "Exchanges email + password for a JWT. The whole board authenticates with this." },
  { group: "Auth", name: "Setup first admin", method: "POST", path: "/auth/setup", auth: "public", probe: true, description: "Bootstraps the first moderator. Returns 403 once setup is complete (expected)." },
  { group: "Auth", name: "Current user", method: "GET", path: "/auth/me", auth: "user", probe: true, description: "Returns the authenticated user's profile from the bearer token." },
  { group: "Auth", name: "Register member", method: "POST", path: "/auth/register", auth: "moderator", probe: false, description: "Creates a moderator/user account. Mutating — catalogued only." },
  { group: "Auth", name: "Change password", method: "PATCH", path: "/auth/password", auth: "user", probe: false, description: "Updates the current user's password. Mutating — catalogued only." },

  // Appointments
  { group: "Appointments", name: "List appointments", method: "GET", path: "/api/appointments", auth: "user", probe: true, description: "Paginated appointments, filterable by date and status." },
  { group: "Appointments", name: "Get appointment", method: "GET", path: "/api/appointments/:id", auth: "user", probe: true, sample: "appointment", description: "A single appointment with patient, provider and scheduling details." },
  { group: "Appointments", name: "Update appointment", method: "PATCH", path: "/api/appointments/:id", auth: "user", probe: false, description: "Changes appointment status/details. Mutating — catalogued only." },
  { group: "Appointments", name: "Cancel appointment", method: "DELETE", path: "/api/appointments/:id", auth: "user", probe: false, description: "Cancels an appointment. Mutating — catalogued only." },

  // Patients
  { group: "Patients", name: "Search patients", method: "GET", path: "/api/patients/search?q=a", auth: "user", probe: true, description: "Fuzzy search by name, phone or email. Requires a query term." },
  { group: "Patients", name: "Get patient", method: "GET", path: "/api/patients/:id", auth: "user", probe: true, sample: "patient", description: "Patient profile plus appointment history and recent calls." },
  { group: "Patients", name: "Update patient", method: "PATCH", path: "/api/patients/:id", auth: "moderator", probe: false, description: "Edits patient details. Mutating — catalogued only." },

  // Calls
  { group: "Calls", name: "List calls", method: "GET", path: "/api/calls", auth: "user", probe: true, description: "Paginated call logs with outcome, intent and duration." },
  { group: "Calls", name: "Get call", method: "GET", path: "/api/calls/:callSid", auth: "user", probe: true, sample: "call", description: "Full call record including transcript and tool-call events." },

  // Analytics
  { group: "Analytics", name: "Overview", method: "GET", path: "/api/analytics/overview", auth: "user", probe: true, description: "Headline KPIs: call volume, completion, transfers, appointment mix." },
  { group: "Analytics", name: "Top intents", method: "GET", path: "/api/analytics/intents", auth: "user", probe: true, description: "What callers ask for, ranked by frequency." },
  { group: "Analytics", name: "Hourly volume", method: "GET", path: "/api/analytics/hourly", auth: "user", probe: true, description: "Call counts by hour of day for staffing insight." },
  { group: "Analytics", name: "Performance metrics", method: "GET", path: "/api/analytics/metrics", auth: "user", probe: true, description: "Response latency (avg/p95), STT confidence and tool usage." },

  // Sessions
  { group: "Sessions", name: "Session stats", method: "GET", path: "/api/sessions/stats", auth: "moderator", probe: true, description: "Live/active session counts and aggregates. Requires moderator." },
  { group: "Sessions", name: "Cleanup sessions", method: "POST", path: "/api/sessions/cleanup", auth: "moderator", probe: false, description: "Purges expired sessions from Redis. Mutating — catalogued only." },

  // FAQs
  { group: "FAQs", name: "List FAQs", method: "GET", path: "/api/faqs", auth: "user", probe: true, description: "Knowledge-base entries the voice assistant answers from." },
  { group: "FAQs", name: "FAQ categories", method: "GET", path: "/api/faqs/categories", auth: "user", probe: true, description: "Distinct FAQ categories used for filtering." },
  { group: "FAQs", name: "Create FAQ", method: "POST", path: "/api/faqs", auth: "moderator", probe: false, description: "Adds a knowledge-base entry. Mutating — catalogued only." },
  { group: "FAQs", name: "Update FAQ", method: "PATCH", path: "/api/faqs/:id", auth: "moderator", probe: false, description: "Edits a knowledge-base entry. Mutating — catalogued only." },
  { group: "FAQs", name: "Delete FAQ", method: "DELETE", path: "/api/faqs/:id", auth: "moderator", probe: false, description: "Deactivates a knowledge-base entry. Mutating — catalogued only." },
];

function isEmpty(json: JsonValue): boolean {
  if (json == null) return true;
  if (Array.isArray(json)) return json.length === 0;
  if (typeof json === "object") {
    const o = json as Record<string, JsonValue>;
    if (Array.isArray(o.data)) return (o.data as JsonValue[]).length === 0;
    if (typeof o.count === "number") return o.count === 0;
    if (o.data && typeof o.data === "object") {
      return Object.keys(o.data as object).length === 0;
    }
  }
  return false;
}

async function probe(
  ep: Endpoint,
  resolvedPath: string,
  token?: string,
): Promise<StatusCheck> {
  const base: StatusCheck = {
    group: ep.group,
    name: ep.name,
    method: ep.method,
    path: resolvedPath,
    auth: ep.auth,
    description: ep.description,
    probed: true,
    ok: false,
  };

  const start = Date.now();
  try {
    const headers: Record<string, string> = {};
    if (ep.auth !== "public" && token) headers["Authorization"] = `Bearer ${token}`;

    // Login is the only POST we actively send (with the status creds).
    let body: string | undefined;
    if (ep.path === "/auth/login") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({ email: STATUS_EMAIL, password: STATUS_PASSWORD });
    } else if (ep.path === "/auth/setup") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({
        fullName: "Status Check",
        email: "status@check.local",
        password: "StatusCheck123!",
      });
    }

    const res = await fetch(`${BACKEND}${resolvedPath}`, {
      method: ep.method,
      headers,
      body,
      cache: "no-store",
    });
    const ms = Date.now() - start;

    let preview: JsonValue = null;
    let empty = false;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const json = (await res.json().catch(() => null)) as JsonValue;
      empty = res.ok && isEmpty(json);
      if (Array.isArray(json)) preview = { type: "array", length: json.length, sample: json.slice(0, 1) };
      else preview = json;
    } else {
      preview = (await res.text().catch(() => "")).slice(0, 240);
    }

    // /auth/setup returning 403 means "already set up" — that's healthy.
    const ok = res.ok || (ep.path === "/auth/setup" && res.status === 403);
    return { ...base, ok, status: res.status, ms, empty, preview };
  } catch (e: unknown) {
    return { ...base, ok: false, ms: Date.now() - start, error: e instanceof Error ? e.message : String(e) };
  }
}

function firstId(preview: JsonValue | undefined, keys: string[]): string | null {
  if (!preview || typeof preview !== "object") return null;
  const data = (preview as Record<string, JsonValue>).data;
  const arr = Array.isArray(data) ? data : null;
  if (!arr || !arr.length) return null;
  const row = arr[0];
  if (!row || typeof row !== "object") return null;
  for (const k of keys) {
    const v = (row as Record<string, JsonValue>)[k];
    if (typeof v === "string" && v) return v;
    if (typeof v === "number") return String(v);
  }
  return null;
}

export async function GET() {
  const missingCreds = !STATUS_EMAIL || !STATUS_PASSWORD;

  // 1) Authenticate (also the first catalogued check).
  const loginEp = CATALOG.find((e) => e.path === "/auth/login")!;
  let loginCheck: StatusCheck;
  let token: string | undefined;

  if (missingCreds) {
    loginCheck = {
      group: loginEp.group, name: loginEp.name, method: loginEp.method, path: loginEp.path,
      auth: loginEp.auth, description: loginEp.description, probed: true, ok: false, status: 500,
      error: "Missing STATUS_CHECK_EMAIL / STATUS_CHECK_PASSWORD env vars.",
    };
  } else {
    loginCheck = await probe(loginEp, loginEp.path);
    if (loginCheck.ok && loginCheck.preview && typeof loginCheck.preview === "object") {
      token = (loginCheck.preview as { data?: { token?: string } })?.data?.token;
    }
  }

  // 2) Resolve sample ids from the list endpoints so by-id probes hit real rows.
  const samples: Record<string, string | null> = { appointment: null, patient: null, call: null };
  if (token) {
    const [appts, pats, calls] = await Promise.all([
      probe(CATALOG.find((e) => e.path === "/api/appointments")!, "/api/appointments?limit=1", token),
      probe(CATALOG.find((e) => e.path === "/api/patients/search?q=a")!, "/api/patients/search?q=a&limit=1", token),
      probe(CATALOG.find((e) => e.path === "/api/calls")!, "/api/calls?limit=1", token),
    ]);
    samples.appointment = firstId(appts.preview, ["id", "appointment_id"]);
    samples.patient = firstId(pats.preview, ["id", "patient_id"]);
    samples.call = firstId(calls.preview, ["callSid", "call_sid", "sid", "id"]);
  }

  // 3) Probe every catalogued, non-mutating endpoint.
  const results: StatusCheck[] = await Promise.all(
    CATALOG.map(async (ep) => {
      if (ep.path === "/auth/login") return loginCheck;
      if (!ep.probe) {
        return {
          group: ep.group, name: ep.name, method: ep.method, path: ep.path,
          auth: ep.auth, description: ep.description, probed: false, ok: false,
        };
      }
      let resolved = ep.path;
      if (ep.sample) {
        const id = samples[ep.sample];
        resolved = id
          ? ep.path.replace(/:(id|callSid)/, id)
          : ep.path.replace(/:(id|callSid)/, ep.sample === "call" ? "none" : "1");
      }
      return probe(ep, resolved, token);
    }),
  );

  const probed = results.filter((c) => c.probed);
  const okCount = probed.filter((c) => c.ok).length;

  const summary = {
    backend: BACKEND,
    okCount,
    probedTotal: probed.length,
    catalogTotal: results.length,
    loggedIn: !!token,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json({ summary, checks: results });
}
