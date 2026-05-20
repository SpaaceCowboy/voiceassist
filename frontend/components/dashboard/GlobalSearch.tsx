"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { backendGet, BackendError } from "@/lib/backend";

type AnyObj = Record<string, unknown>;

type SearchGroup = "all" | "appointments" | "calls" | "patients" | "faqs";

type ResultItem = {
  group: Exclude<SearchGroup, "all">;
  id: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  href: string;
};

type GroupResults = {
  appointments: ResultItem[];
  calls: ResultItem[];
  patients: ResultItem[];
  faqs: ResultItem[];
};

function norm(s: string): string {
  return s.toLowerCase().trim();
}

function s(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function clip(text: string, max = 120): string {
  const t = text.trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function highlight(text: string, q: string): JSX.Element {
  const t = text ?? "";
  const nq = norm(q);
  if (!nq) return <>{t}</>;
  const lt = t.toLowerCase();
  const idx = lt.indexOf(nq);
  if (idx < 0) return <>{t}</>;
  const before = t.slice(0, idx);
  const mid = t.slice(idx, idx + nq.length);
  const after = t.slice(idx + nq.length);
  return (
    <>
      {before}
      <mark
        className="rounded px-1"
        style={{ background: "rgba(99,102,241,0.18)", color: "inherit" }}
      >
        {mid}
      </mark>
      {after}
    </>
  );
}

function tone(group: Exclude<SearchGroup, "all">): "neutral" | "good" | "warn" {
  if (group === "appointments") return "good";
  if (group === "calls") return "warn";
  return "neutral";
}

function groupLabel(group: Exclude<SearchGroup, "all">): string {
  if (group === "appointments") return "Appointments";
  if (group === "calls") return "Calls";
  if (group === "patients") return "Patients";
  return "FAQs";
}

function pillText(group: Exclude<SearchGroup, "all">): string {
  if (group === "appointments") return "APPT";
  if (group === "calls") return "CALL";
  if (group === "patients") return "PT";
  return "FAQ";
}

function pickId(o: AnyObj, keys: string[]): string {
  for (const k of keys) {
    const v = s(o[k]);
    if (v) return v;
  }
  return "";
}

function scoreFor(hay: string, q: string): number {
  const t = norm(q);
  if (!t) return 0;
  const lower = hay.toLowerCase();
  let score = 0;
  if (lower.includes(t)) score += 10;
  const tokens = t.split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    if (tok.length >= 2 && lower.includes(tok)) score += 2;
  }
  return score;
}

function groupCard(
  title: string,
  items: ResultItem[],
  q: string,
  viewAllHref?: string,
): JSX.Element {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <div className="flex items-center gap-2">
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="text-xs underline underline-offset-2"
              style={{ color: "rgb(var(--muted))" }}
            >
              View all
            </Link>
          ) : null}
          <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            {items.length}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-3 text-sm" style={{ color: "rgb(var(--muted))" }}>
          No matches.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((it) => (
            <Link
              key={`${it.group}:${it.id}`}
              href={it.href}
              className="block rounded-xl border p-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              style={{ borderColor: "rgb(var(--border))" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge text={pillText(it.group)} tone={tone(it.group)} />
                    <div className="font-medium truncate">
                      {highlight(it.title, q)}
                    </div>
                  </div>
                  {it.subtitle ? (
                    <div
                      className="text-xs mt-1"
                      style={{ color: "rgb(var(--muted))" }}
                    >
                      {highlight(it.subtitle, q)}
                    </div>
                  ) : null}
                  {it.snippet ? (
                    <div
                      className="text-xs mt-1"
                      style={{ color: "rgb(var(--muted))" }}
                    >
                      {highlight(it.snippet, q)}
                    </div>
                  ) : null}
                </div>
                <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                  View →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 250);

  const [group, setGroup] = useState<SearchGroup>("all");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [raw, setRaw] = useState<GroupResults>({
    appointments: [],
    calls: [],
    patients: [],
    faqs: [],
  });

  // Keyboard shortcuts:
  //  - / focuses search
  //  - Cmd/Ctrl+K focuses search
  //  - Esc clears search (or blurs if already empty)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // ignore while typing in inputs/textareas unless it's Esc
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      const typing = tag === "input" || tag === "textarea" || (e.target as HTMLElement | null)?.isContentEditable;

      if (e.key === "Escape") {
        if (q.trim()) {
          e.preventDefault();
          setQ("");
          setGroup("all");
          inputRef.current?.focus();
        } else {
          inputRef.current?.blur();
        }
        return;
      }

      if (typing) return;

      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [q]);

  useEffect(() => {
    const query = qDebounced.trim();
    if (query.length < 2) {
      setRaw({ appointments: [], calls: [], patients: [], faqs: [] });
      setErr(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const [apptRes, callsRes, faqsRes, patientsRes] = await Promise.all([
          backendGet<{ success?: boolean; data?: AnyObj[] }>(
            "/api/appointments?limit=120&offset=0",
          ).catch(() => ({ data: [] })),
          backendGet<{ success?: boolean; data?: AnyObj[] }>(
            "/api/calls?limit=120&offset=0",
          ).catch(() => ({ data: [] })),
          backendGet<{ success?: boolean; data?: AnyObj[] }>(
            "/api/faqs",
          ).catch(() => ({ data: [] })),
          backendGet<{ success?: boolean; data?: AnyObj[] }>(
            `/api/patients/search?q=${encodeURIComponent(query)}&limit=25&offset=0`,
          ).catch(() => ({ data: [] })),
        ]);

        if (cancelled) return;

        const appts = apptRes?.data ?? [];
        const calls = callsRes?.data ?? [];
        const faqs = faqsRes?.data ?? [];
        const patients = patientsRes?.data ?? [];

        const qn = norm(query);

        const apptItems = appts
          .map((o) => {
            const id = pickId(o, ["id", "appointment_id", "appointmentId"]);
            const title =
              s(o.patient_name) ||
              s(o.full_name) ||
              `Appointment #${id || "—"}`;
            const subtitle = [
              s(o.department_name) || s(o.department),
              s(o.doctor_name) || s(o.provider_name),
            ]
              .filter(Boolean)
              .join(" • ");
            const snippet = [s(o.reason_for_visit), s(o.status)]
              .filter(Boolean)
              .join(" • ");
            const hay = `${title} ${subtitle} ${snippet} ${s(o.patient_phone)} ${s(o.confirmation_code)} ${s(o.appointment_date)} ${s(o.appointment_time)} ${s(o.scheduled_time)}`;
            return {
              score: scoreFor(hay, qn),
              item: {
                group: "appointments" as const,
                id: id || `${Math.random()}`,
                title,
                subtitle: subtitle || undefined,
                snippet: clip(snippet, 120) || undefined,
                href: id ? `/appointments/${id}` : "/appointments",
              },
            };
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6)
          .map((x) => x.item);

        const callItems = calls
          .map((o) => {
            const sid = pickId(o, ["callSid", "call_sid", "sid", "id"]);
            const title = s(o.patient_name)
              ? `Call • ${s(o.patient_name)}`
              : `Call ${sid ? sid.slice(0, 6) : "—"}`;
            const subtitle = [s(o.intent), s(o.status)]
              .filter(Boolean)
              .join(" • ");
            const snippet = s(o.summary) || s(o.problem) || "";
            const hay = `${title} ${subtitle} ${snippet} ${s(o.from_number)} ${s(o.to_number)} ${s(o.sentiment)}`;
            return {
              score: scoreFor(hay, qn),
              item: {
                group: "calls" as const,
                id: sid || `${Math.random()}`,
                title,
                subtitle: subtitle || undefined,
                snippet: clip(snippet, 120) || undefined,
                href: sid ? `/calls/${sid}` : "/calls",
              },
            };
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6)
          .map((x) => x.item);

        const faqItems = faqs
          .map((o) => {
            const id = pickId(o, ["id", "faq_id", "faqId"]);
            const title =
              s(o.question_pattern) ||
              s(o.questionPattern) ||
              s(o.question) ||
              "FAQ";
            const subtitle = s(o.category) || "";
            const snippet =
              s(o.answer_short) || s(o.answerShort) || s(o.answer) || "";
            const variations =
              (o.question_variations as string[] | undefined) ??
              (o.questionVariations as string[] | undefined) ??
              [];
            const hay = `${title} ${subtitle} ${snippet} ${variations.join(" ")}`;
            return {
              score: scoreFor(hay, qn),
              item: {
                group: "faqs" as const,
                id: id || `${Math.random()}`,
                title,
                subtitle: subtitle || undefined,
                snippet: clip(snippet, 120) || undefined,
                href: "/faqs",
              },
            };
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6)
          .map((x) => x.item);

        const patientItems = patients
          .map((o) => {
            const id = pickId(o, ["id", "patient_id", "patientId"]);
            const title =
              s(o.full_name) || s(o.fullName) || s(o.name) || "Patient";
            const subtitle = [
              s(o.phone) || s(o.phone_number),
              s(o.dob) || s(o.date_of_birth),
            ]
              .filter(Boolean)
              .join(" • ");
            const hay = `${title} ${subtitle} ${s(o.email)} ${s(o.address)} ${s(o.insuranceProvider)}`;
            return {
              score: scoreFor(hay, qn),
              item: {
                group: "patients" as const,
                id: id || `${Math.random()}`,
                title,
                subtitle: subtitle || undefined,
                href: id ? `/patients/${id}` : "/patients",
              },
            };
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6)
          .map((x) => x.item);

        setRaw({
          appointments: apptItems,
          calls: callItems,
          patients: patientItems,
          faqs: faqItems,
        });
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e instanceof BackendError
            ? `Search failed (${e.status})`
            : e instanceof Error
              ? e.message
              : "Search failed";
        setErr(msg);
        setRaw({ appointments: [], calls: [], patients: [], faqs: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [qDebounced]);

  const counts = {
    appointments: raw.appointments.length,
    calls: raw.calls.length,
    patients: raw.patients.length,
    faqs: raw.faqs.length,
  };

  const totalCount =
    counts.appointments + counts.calls + counts.patients + counts.faqs;

  const visible = useMemo(() => {
    if (group === "appointments")
      return { appointments: raw.appointments, calls: [], patients: [], faqs: [] };
    if (group === "calls")
      return { appointments: [], calls: raw.calls, patients: [], faqs: [] };
    if (group === "patients")
      return { appointments: [], calls: [], patients: raw.patients, faqs: [] };
    if (group === "faqs")
      return { appointments: [], calls: [], patients: [], faqs: raw.faqs };
    return raw;
  }, [group, raw]);

  const viewAll = {
    appointments: qDebounced.trim() ? `/appointments?search=${encodeURIComponent(qDebounced.trim())}` : "/appointments",
    calls: qDebounced.trim() ? `/calls?search=${encodeURIComponent(qDebounced.trim())}` : "/calls",
    patients: qDebounced.trim() ? `/patients?search=${encodeURIComponent(qDebounced.trim())}` : "/patients",
    faqs: qDebounced.trim() ? `/faqs?search=${encodeURIComponent(qDebounced.trim())}` : "/faqs",
  };

  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[260px] flex-1">
            <Input
              value={q}
              onChange={setQ}
              placeholder="Search across appointments, calls, patients, FAQs… (/, Ctrl+K)"
              inputRef={inputRef}
            />
          </div>

          <Button variant="ghost" onClick={() => setQ("")} disabled={!q.trim()}>
            Clear
          </Button>

          <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            {loading
              ? "Searching…"
              : qDebounced.trim().length < 2
                ? "Type 2+ chars"
                : "Ready"}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {["all", "appointments", "calls", "patients", "faqs"].map((g) => {
            const gg = g as SearchGroup;
            const isActive = gg === group;
            const label =
              gg === "all"
                ? "All"
                : groupLabel(gg as Exclude<SearchGroup, "all">);
            const count =
              gg === "all"
                ? totalCount
                : counts[gg as Exclude<SearchGroup, "all">];
            return (
              <button
                key={g}
                onClick={() => setGroup(gg)}
                className="px-3 py-2 rounded-xl border text-sm"
                style={{
                  background: isActive
                    ? "rgba(99,102,241,0.14)"
                    : "rgb(var(--surface2))",
                  borderColor: "rgb(var(--border))",
                  color: "rgb(var(--text))",
                }}
              >
                {label}
                <span
                  className="ml-2 text-xs"
                  style={{ color: "rgb(var(--muted))" }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            disabled={qDebounced.trim().length < 2}
            onClick={() => router.push(viewAll.appointments)}
          >
            View all appointments
          </Button>
          <Button
            variant="ghost"
            disabled={qDebounced.trim().length < 2}
            onClick={() => router.push(viewAll.calls)}
          >
            View all calls
          </Button>
          <Button
            variant="ghost"
            disabled={qDebounced.trim().length < 2}
            onClick={() => router.push(viewAll.patients)}
          >
            View all patients
          </Button>
          <Button
            variant="ghost"
            disabled={qDebounced.trim().length < 2}
            onClick={() => router.push(viewAll.faqs)}
          >
            View all FAQs
          </Button>
        </div>

        {err ? (
          <div className="mt-3 text-sm" style={{ color: "rgb(239,68,68)" }}>
            {err}
          </div>
        ) : null}

        {qDebounced.trim().length >= 2 &&
        !loading &&
        totalCount === 0 ? (
          <div className="mt-3 text-sm" style={{ color: "rgb(var(--muted))" }}>
            No results.
          </div>
        ) : null}
      </Card>

      {qDebounced.trim().length >= 2 ? (
        <div className="grid lg:grid-cols-2 gap-3">
          {group === "all" || group === "appointments"
            ? groupCard("Appointments", visible.appointments, qDebounced, viewAll.appointments)
            : null}
          {group === "all" || group === "calls"
            ? groupCard("Calls", visible.calls, qDebounced, viewAll.calls)
            : null}
          {group === "all" || group === "patients"
            ? groupCard("Patients", visible.patients, qDebounced, viewAll.patients)
            : null}
          {group === "all" || group === "faqs"
            ? groupCard("FAQs", visible.faqs, qDebounced, viewAll.faqs)
            : null}
        </div>
      ) : null}
    </div>
  );
}
