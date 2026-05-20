// Path: components/faqs/editor/FaqEditorModal.tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function FaqEditorModal({
  title,
  initial,
  categories,
  onClose,
  onSave,
  saving,
}: {
  title: string;
  initial: { question: string; answer: string; category: string };
  categories: string[];
  onClose: () => void;
  onSave: (p: { question: string; answer: string; category?: string }) => void;
  saving: boolean;
}) {
  const [question, setQuestion] = useState(initial.question);
  const [answer, setAnswer] = useState(initial.answer);
  const [category, setCategory] = useState(initial.category);

  const canSave = question.trim().length > 2 && answer.trim().length > 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <Card className="relative w-full max-w-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
              Keep answers short and clear.
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Question
          </div>
          <Input value={question} onChange={setQuestion} placeholder="FAQ question…" />
        </div>

        <div className="space-y-2">
          <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Answer
          </div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full min-h-[120px] px-3 py-2 rounded-xl border text-sm"
            style={{
              background: "rgb(var(--surface2))",
              borderColor: "rgb(var(--border))",
              color: "rgb(var(--text))",
            }}
            placeholder="FAQ answer…"
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Category
          </div>
          <input
            list="faq-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{
              background: "rgb(var(--surface2))",
              borderColor: "rgb(var(--border))",
              color: "rgb(var(--text))",
            }}
            placeholder="e.g. Billing, Scheduling…"
          />
          <datalist id="faq-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSave || saving}
            onClick={() =>
              onSave({
                question: question.trim(),
                answer: answer.trim(),
                category: category.trim() ? category.trim() : undefined,
              })
            }
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </Card>
    </div>
  );
}