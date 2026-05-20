// Path: components/faqs/list/FaqsFiltersBar.tsx
"use client";

import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function FaqsFiltersBar({
  q,
  setQ,
  category,
  setCategory,
  categories,
  count,
}: {
  q: string;
  setQ: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  categories: string[];
  count: number;
}) {
  return (
    <Card className="p-3 flex flex-wrap gap-2 items-center">
      <Input
        value={q}
        onChange={setQ}
        placeholder="Search FAQs…"
        className="w-80"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="px-3 py-2 rounded-xl border text-sm"
        style={{
          background: "rgb(var(--surface2))",
          borderColor: "rgb(var(--border))",
          color: "rgb(var(--text))",
        }}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <div className="ml-auto text-xs" style={{ color: "rgb(var(--muted))" }}>
        {count} results
      </div>
    </Card>
  );
}