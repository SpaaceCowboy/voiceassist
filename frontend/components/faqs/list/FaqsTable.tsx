// Path: components/faqs/list/FaqsTable.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { TableShell, THead, TH, TR, TD } from "@/components/ui/TableShell";
import type { FaqItem } from "@/lib/types";

type Row = FaqItem | Record<string, unknown>;

function readString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function pickId(row: Row): string {
  const o = row as unknown as Record<string, unknown>;
  return (
    readString(o, "id") ??
    readString(o, "faq_id") ??
    readString(o, "faqId") ??
    ""
  );
}

function pickQuestion(row: Row): string {
    const o = row as unknown as Record<string, unknown>;
    return (
      readString(o, "question_pattern") ??     // ✅ your backend
      readString(o, "question") ??
      readString(o, "question_text") ??
      readString(o, "questionText") ??
      readString(o, "q") ??
      readString(o, "prompt") ??
      "—"
    );
  }
  
  function pickAnswer(row: Row): string {
    const o = row as unknown as Record<string, unknown>;
    return (
      readString(o, "answer_short") ??         // ✅ your backend
      readString(o, "answer") ??
      readString(o, "answer_text") ??
      readString(o, "answerText") ??
      readString(o, "a") ??
      readString(o, "response") ??
      "—"
    );
  }
  
  function pickActive(row: Row): boolean {
    const o = row as unknown as Record<string, unknown>;
    const v =
      o["is_active"] ??                        // ✅ your backend
      o["active"] ??
      o["isActive"] ??
      o["enabled"];
  
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") {
      const s = v.toLowerCase().trim();
      if (s === "true" || s === "1" || s === "yes" || s === "active") return true;
      if (s === "false" || s === "0" || s === "no" || s === "inactive") return false;
    }
    return true;
  }

function pickCategory(row: Row): string {
  const o = row as unknown as Record<string, unknown>;
  return (
    readString(o, "category") ??
    readString(o, "faq_category") ??
    readString(o, "faqCategory") ??
    "—"
  );
}

// function pickActive(row: Row): boolean {
//   const o = row as unknown as Record<string, unknown>;
//   const v = o["active"] ?? o["is_active"] ?? o["enabled"];
//   if (typeof v === "boolean") return v;
//   if (typeof v === "number") return v !== 0;
//   if (typeof v === "string") {
//     const s = v.toLowerCase().trim();
//     if (s === "true" || s === "1" || s === "yes" || s === "active") return true;
//     if (s === "false" || s === "0" || s === "no" || s === "inactive") return false;
//   }
//   // default to true if not provided (common backend behavior)
//   return true;
// }

function clip(s: string, n: number): string {
  if (!s || s === "—") return "—";
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export function FaqsTable({
  rows,
  onEdit,
  onDeactivate,
}: {
  rows: FaqItem[];
  onEdit: (f: FaqItem) => void;
  onDeactivate: (id: string | number) => void;
}) {
  return (
    <TableShell>
      <THead>
        <tr>
          <TH>Question</TH>
          <TH>Category</TH>
          <TH>Active</TH>
          <TH>Answer (preview)</TH>
          <TH widthClass="w-[240px]">Actions</TH>
        </tr>
      </THead>

      <tbody>
        {rows.map((f, idx) => {
          const id = pickId(f);
          const key = id ? `faq:${id}` : `row:${idx}`;
          const question = pickQuestion(f);
          const answer = pickAnswer(f);
          const category = pickCategory(f);
          const active = pickActive(f);

          return (
            <TR key={key}>
              <TD className="font-medium">
                <div className="max-w-[520px] break-words">{question}</div>
              </TD>

              <TD>{category}</TD>

              <TD>
                <span
                  className={`inline-flex px-2 py-1 rounded-full text-xs ${
                    active
                      ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-200"
                      : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200"
                  }`}
                >
                  {active ? "Yes" : "No"}
                </span>
              </TD>

              <TD>
                <div className="max-w-[520px] break-words" title={answer}>
                  {clip(answer, 90)}
                </div>
              </TD>

              <TD>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => onEdit(f)}>
                    Edit
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => {
                      if (!id) return;
                      if (confirm("Deactivate this FAQ?")) onDeactivate(id);
                    }}
                    disabled={!id}
                  >
                    Deactivate
                  </Button>
                </div>
              </TD>
            </TR>
          );
        })}

        {rows.length === 0 ? (
          <TR>
            <TD colSpan={5} className="p-6 text-center">
              <span className="text-sm" style={{ color: "rgb(var(--muted))" }}>
                No FAQs found.
              </span>
            </TD>
          </TR>
        ) : null}
      </tbody>
    </TableShell>
  );
}