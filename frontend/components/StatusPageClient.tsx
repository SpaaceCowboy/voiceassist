"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusPill, type Tone } from "@/components/ui/StatusPill";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActivityIcon, RefreshIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/Skeleton";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type Auth = "public" | "user" | "moderator";

type StatusCheck = {
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

type StatusResponse = {
  summary: {
    backend: string;
    okCount: number;
    probedTotal: number;
    catalogTotal: number;
    loggedIn: boolean;
    timestamp: string;
  };
  checks: StatusCheck[];
};

/** Plain-language interpretation of each result — the "what does this mean" helper. */
function interpret(c: StatusCheck): { tone: Tone; label: string; hint: string } {
  if (!c.probed) {
    return {
      tone: "neutral",
      label: "Not checked",
      hint: "Mutating endpoint (write/delete) — listed for reference, not health-checked to avoid side effects.",
    };
  }
  if (c.error) {
    return {
      tone: "bad",
      label: "Unreachable",
      hint: `Backend not connected — the request never completed (${c.error}). Is the API container running?`,
    };
  }
  const s = c.status ?? 0;
  if (s >= 500) {
    return {
      tone: "bad",
      label: `${s} Server error`,
      hint: "The API is reachable but failed — likely a backend exception or a database/Redis problem on this route.",
    };
  }
  if (s === 401) {
    return {
      tone: "warn",
      label: "401 Unauthorized",
      hint: "Authentication failed — the status credentials are missing/expired, so no token was issued.",
    };
  }
  if (s === 403) {
    if (c.path === "/auth/setup") {
      return { tone: "good", label: "403 Already set up", hint: "Expected — the first admin already exists, so setup is correctly locked." };
    }
    return {
      tone: "warn",
      label: "403 Forbidden",
      hint: "Reachable, but this route needs higher privileges (moderator/admin) than the status account has.",
    };
  }
  if (s === 404) {
    return {
      tone: "warn",
      label: "404 Not found",
      hint: "The route works but the sample record doesn't exist yet — usually means the table has no data to link to.",
    };
  }
  if (s === 400) {
    return { tone: "warn", label: "400 Bad request", hint: "Reachable, but the request was missing or had invalid parameters." };
  }
  if (s >= 200 && s < 300) {
    if (c.empty) {
      return {
        tone: "info",
        label: `${s} OK · empty`,
        hint: "Connected and healthy, but this endpoint returned no data yet — the database may be unseeded for it.",
      };
    }
    return { tone: "good", label: `${s} OK`, hint: "Connected and returning data normally." };
  }
  return { tone: "neutral", label: s ? String(s) : "—", hint: "Unexpected response." };
}

const METHOD_TONE: Record<string, string> = {
  GET: "text-sky-600 dark:text-sky-300 bg-sky-500/10",
  POST: "text-emerald-600 dark:text-emerald-300 bg-emerald-500/10",
  PATCH: "text-amber-600 dark:text-amber-300 bg-amber-500/10",
  PUT: "text-amber-600 dark:text-amber-300 bg-amber-500/10",
  DELETE: "text-red-600 dark:text-red-300 bg-red-500/10",
};

function MethodChip({ method }: { method: string }) {
  return (
    <span className={`inline-block rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${METHOD_TONE[method] ?? "bg-white/10"}`}>
      {method}
    </span>
  );
}

function AuthChip({ auth }: { auth: Auth }) {
  const map: Record<Auth, { label: string; cls: string }> = {
    public: { label: "Public", cls: "text-emerald-600 dark:text-emerald-300" },
    user: { label: "Authenticated", cls: "text-sky-600 dark:text-sky-300" },
    moderator: { label: "Moderator", cls: "text-teal-600 dark:text-teal-300" },
  };
  const a = map[auth];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${a.cls}`}
      style={{ borderColor: "rgb(var(--border))" }}
    >
      {a.label}
    </span>
  );
}

function EndpointRow({ c }: { c: StatusCheck }) {
  const v = interpret(c);
  const [open, setOpen] = useState(false);
  return (
    <div className="px-4 py-3 transition hover:bg-[rgb(var(--surface2))]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <MethodChip method={c.method} />
        <code className="font-mono text-xs" style={{ color: "rgb(var(--text))" }}>
          {c.path}
        </code>
        <AuthChip auth={c.auth} />
        <div className="ml-auto flex items-center gap-2">
          {c.probed && typeof c.ms === "number" ? (
            <span className="text-xs tabular-nums" style={{ color: "rgb(var(--muted))" }}>
              {c.ms} ms
            </span>
          ) : null}
          <StatusPill value={v.label} tone={v.tone} humanize={false} size="sm" />
        </div>
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <span className="text-sm font-medium">{c.name}</span>
          <span className="ml-2 text-xs" style={{ color: "rgb(var(--muted))" }}>
            {c.description}
          </span>
        </div>
        {c.probed && c.preview != null ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="shrink-0 text-xs underline-offset-2 hover:underline"
            style={{ color: "rgb(var(--accent))" }}
          >
            {open ? "Hide response" : "View response"}
          </button>
        ) : null}
      </div>

      <div className="mt-1 text-xs" style={{ color: "rgb(var(--muted))" }}>
        {v.hint}
      </div>

      {open && c.preview != null ? (
        <pre
          className="mt-2 max-h-56 overflow-auto rounded-lg p-3 text-[11px] leading-relaxed"
          style={{ background: "rgb(var(--surface2))" }}
        >
          {JSON.stringify(c.preview, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

export function StatusPageClient() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/status/run", { cache: "no-store" });
      const json = (await res.json()) as StatusResponse;
      setData(json);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function rerun() {
    setLoading(true);
    setErr(null);
    void load();
  }

  const groups = useMemo(() => {
    if (!data) return [];
    const order = ["System", "Auth", "Appointments", "Patients", "Calls", "Analytics", "Sessions", "FAQs"];
    const map = new Map<string, StatusCheck[]>();
    for (const c of data.checks) {
      if (!map.has(c.group)) map.set(c.group, []);
      map.get(c.group)!.push(c);
    }
    const rank = (g: string) => {
      const i = order.indexOf(g);
      return i === -1 ? order.length : i;
    };
    return [...map.entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
  }, [data]);

  const allOk = data ? data.summary.okCount === data.summary.probedTotal : false;
  const degraded = data ? data.summary.probedTotal - data.summary.okCount : 0;

  const header = (
    <PageHeader
      icon={<ActivityIcon />}
      title="API Status"
      subtitle={
        data
          ? `${data.summary.catalogTotal} endpoints catalogued · ${data.summary.probedTotal} health-checked · ${new Date(
              data.summary.timestamp,
            ).toLocaleTimeString()}`
          : "Live health check across every backend endpoint."
      }
      badge={
        data ? (
          <StatusPill
            value={allOk ? "All systems go" : `${degraded} need attention`}
            tone={allOk ? "good" : degraded > 0 ? "bad" : "neutral"}
            humanize={false}
          />
        ) : null
      }
      actions={
        <Button variant="outline" icon={<RefreshIcon size={16} />} onClick={rerun} disabled={loading}>
          {loading ? "Checking…" : "Re-run"}
        </Button>
      }
    />
  );

  if (err) {
    return (
      <div className="space-y-5">
        {header}
        <Card className="p-4 text-sm text-red-600 dark:text-red-400">{err}</Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-5">
        {header}
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {header}

      {!data.summary.loggedIn ? (
        <Card className="p-4 text-sm" style={{ borderColor: "rgba(245,158,11,0.4)" }}>
          <span style={{ color: "rgb(180,120,10)" }}>
            The status account could not authenticate, so authenticated routes show 401. Set valid{" "}
            <code className="font-mono">STATUS_CHECK_EMAIL</code> /{" "}
            <code className="font-mono">STATUS_CHECK_PASSWORD</code> for the frontend.
          </span>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map(([group, checks]) => {
          const probed = checks.filter((c) => c.probed);
          const ok = probed.filter((c) => c.ok).length;
          const groupTone: Tone =
            probed.length === 0 ? "neutral" : ok === probed.length ? "good" : ok === 0 ? "bad" : "warn";
          return (
            <Card key={group} className="overflow-hidden">
              <div
                className="flex items-center justify-between border-b px-4 py-3"
                style={{ borderColor: "rgb(var(--border))", background: "rgb(var(--surface2))" }}
              >
                <div className="font-semibold">{group}</div>
                <StatusPill
                  value={probed.length ? `${ok}/${probed.length} OK` : `${checks.length} listed`}
                  tone={groupTone}
                  humanize={false}
                  size="sm"
                />
              </div>
              <div className="divide-y divide-[rgb(var(--border))]">
                {checks.map((c) => (
                  <EndpointRow key={`${c.method}:${c.path}`} c={c} />
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
