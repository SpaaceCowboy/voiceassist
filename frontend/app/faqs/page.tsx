"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonTable } from "@/components/ui/Skeleton";

type Obj = Record<string, unknown>;

type Faq = {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  active?: boolean | null;
};

function normalizeFaq(x: Obj): Faq {
  const cat = x.category ?? x.type ?? null;
  const act =
    typeof x.active === "boolean"
      ? x.active
      : typeof x.is_active === "boolean"
        ? x.is_active
        : typeof x.enabled === "boolean"
          ? x.enabled
          : null;
  return {
    id: String(x.id ?? x.faq_id ?? x.faqId ?? ""),
    question: String(x.question ?? x.q ?? ""),
    answer: String(x.answer ?? x.a ?? ""),
    category: cat != null ? String(cat) : null,
    active: act,
  };
}

async function safeJson(res: Response) {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getApiBase(): string {
  return "/api/backend";
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("auth-token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function apiGet<T>(path: string): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const headers: Record<string, string> = { ...getAuthHeaders() };
  const res = await fetch(url, { cache: "no-store", headers });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiSend<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const url = `${getApiBase()}${path}`;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...getAuthHeaders(),
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok)
    throw new Error(
      `${method} ${path} failed: ${res.status} ${String(await safeJson(res))}`,
    );
  const data = await safeJson(res);
  return data as T;
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <Card className="relative w-full max-w-xl shadow-xl">
        <div className="p-4 flex items-center justify-between gap-3">
          <div className="font-semibold">{title}</div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="px-4 pb-4">{children}</div>
      </Card>
    </div>
  );
}

export default function FaqsPage() {
  const [rows, setRows] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      [r.question, r.answer, r.category ?? ""].some((v) =>
        v.toLowerCase().includes(t),
      ),
    );
  }, [rows, q]);

  // create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    question: "",
    answer: "",
    category: "",
  });

  // edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    question: "",
    answer: "",
    category: "",
  });

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiGet<unknown>("/api/faqs");
      const list = Array.isArray(data)
        ? data
        : data &&
            typeof data === "object" &&
            "data" in data &&
            Array.isArray((data as { data: unknown[] }).data)
          ? (data as { data: Obj[] }).data
          : [];
      const norm = list
        .filter((x): x is Obj => x != null && typeof x === "object")
        .map(normalizeFaq);
      setRows(norm);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createFaq() {
    setErr(null);
    const payload: Record<string, string | undefined> = {
      question: createForm.question.trim(),
      answer: createForm.answer.trim(),
      category: createForm.category.trim() || undefined,
    };
    if (!payload.question || !payload.answer) {
      setErr("Question and answer are required.");
      return;
    }

    try {
      await apiSend("/api/faqs", "POST", payload);
      setCreateOpen(false);
      setCreateForm({ question: "", answer: "", category: "" });
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  function openEdit(f: Faq) {
    setEditForm({
      id: f.id,
      question: f.question,
      answer: f.answer,
      category: f.category ?? "",
    });
    setEditOpen(true);
  }

  async function updateFaq() {
    setErr(null);
    const payload: Record<string, string | undefined> = {
      question: editForm.question.trim(),
      answer: editForm.answer.trim(),
      category: editForm.category.trim() || undefined,
    };
    if (!payload.question || !payload.answer) {
      setErr("Question and answer are required.");
      return;
    }

    try {
      await apiSend(`/api/faqs/${editForm.id}`, "PATCH", payload);
      setEditOpen(false);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function deactivateFaq(id: string) {
    setErr(null);
    const ok = confirm("Deactivate this FAQ?");
    if (!ok) return;

    try {
      await apiSend(`/api/faqs/${id}`, "DELETE");
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="FAQs"
          subtitle="Manage predefined answers used by the assistant."
          right={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              + New FAQ
            </Button>
          }
        />
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            value={q}
            onChange={setQ}
            placeholder="Search FAQs…"
            className="w-72"
          />
          <Button variant="ghost" onClick={load} disabled={loading}>
            Refresh
          </Button>
          {loading ? (
            <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
              Loading…
            </span>
          ) : null}
        </div>
      </Card>

      {err ? (
        <Card className="border-red-200 dark:border-red-500/30 overflow-hidden">
          <div className="p-4 text-sm text-red-700 dark:text-red-200 bg-red-50/50 dark:bg-red-500/10">
            {err}
          </div>
        </Card>
      ) : null}

      {loading ? (
        <SkeletonTable rows={6} />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: "rgb(var(--surface2))" }}>
              <tr>
                <th className="text-left p-3">Question</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Active</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr
                  key={f.id}
                  className="border-t"
                  style={{ borderColor: "rgb(var(--border))" }}
                >
                  <td className="p-3">
                    <div className="font-medium">{f.question}</div>
                    <div
                      className="text-xs mt-1 line-clamp-2"
                      style={{ color: "rgb(var(--muted))" }}
                    >
                      {f.answer}
                    </div>
                  </td>
                  <td className="p-3">{f.category ?? "—"}</td>
                  <td className="p-3">
                    {typeof f.active === "boolean" ? (
                      <Badge
                        text={f.active ? "Yes" : "No"}
                        tone={f.active ? "good" : "neutral"}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => openEdit(f)}>
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => deactivateFaq(f.id)}
                      >
                        Deactivate
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-6 text-center text-sm"
                    style={{ color: "rgb(var(--muted))" }}
                  >
                    No FAQs found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        open={createOpen}
        title="Create FAQ"
        onClose={() => setCreateOpen(false)}
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <div
              className="text-xs mb-1"
              style={{ color: "rgb(var(--muted))" }}
            >
              Question
            </div>
            <Input
              value={createForm.question}
              onChange={(v) => setCreateForm({ ...createForm, question: v })}
              placeholder="e.g., What documents should I bring?"
              className="w-full"
            />
          </label>

          <label className="block text-sm">
            <div
              className="text-xs mb-1"
              style={{ color: "rgb(var(--muted))" }}
            >
              Answer
            </div>
            <textarea
              value={createForm.answer}
              onChange={(e) =>
                setCreateForm({ ...createForm, answer: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl border text-sm min-h-[120px] outline-none"
              style={{
                background: "rgb(var(--surface2))",
                borderColor: "rgb(var(--border))",
                color: "rgb(var(--text))",
              }}
              placeholder="Write a short, clear answer."
            />
          </label>

          <label className="block text-sm">
            <div
              className="text-xs mb-1"
              style={{ color: "rgb(var(--muted))" }}
            >
              Category (optional)
            </div>
            <Input
              value={createForm.category}
              onChange={(v) => setCreateForm({ ...createForm, category: v })}
              placeholder="e.g., scheduling"
              className="w-full"
            />
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createFaq}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        title="Edit FAQ"
        onClose={() => setEditOpen(false)}
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <div
              className="text-xs mb-1"
              style={{ color: "rgb(var(--muted))" }}
            >
              Question
            </div>
            <Input
              value={editForm.question}
              onChange={(v) => setEditForm({ ...editForm, question: v })}
              className="w-full"
            />
          </label>

          <label className="block text-sm">
            <div
              className="text-xs mb-1"
              style={{ color: "rgb(var(--muted))" }}
            >
              Answer
            </div>
            <textarea
              value={editForm.answer}
              onChange={(e) =>
                setEditForm({ ...editForm, answer: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl border text-sm min-h-[120px] outline-none"
              style={{
                background: "rgb(var(--surface2))",
                borderColor: "rgb(var(--border))",
                color: "rgb(var(--text))",
              }}
            />
          </label>

          <label className="block text-sm">
            <div
              className="text-xs mb-1"
              style={{ color: "rgb(var(--muted))" }}
            >
              Category (optional)
            </div>
            <Input
              value={editForm.category}
              onChange={(v) => setEditForm({ ...editForm, category: v })}
              className="w-full"
            />
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={updateFaq}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
