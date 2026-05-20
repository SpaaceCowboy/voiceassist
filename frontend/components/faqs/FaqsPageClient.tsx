// Path: components/faqs/FaqsPageClient.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useFaqsStore } from "@/store/faqs";
import { FaqsFiltersBar } from "./list/FaqsFiltersBar";
import { FaqsTable } from "./list/FaqsTable";
import { FaqEditorModal } from "./editor/FaqEditorModal";
import type { FaqItem } from "@/lib/types";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

function norm(s: string): string {
  return s.toLowerCase().trim();
}

export default function FaqsPageClient() {
  const {
    q,
    category,
    rows,
    categories,
    loading,
    error,
    modalOpen,
    editing,
    setQuery,
    setCategory,
    refresh,
    openCreate,
    openEdit,
    closeModal,
    save,
    deactivate,
  } = useFaqsStore();

  const qDebounced = useDebouncedValue(q, 200);

  const searchParams = useSearchParams();
const appliedSearchParam = useRef(false);

useEffect(() => {
  if (appliedSearchParam.current) return;
  const sp = searchParams.get("search")?.trim();
  if (sp) setQuery(sp);
  appliedSearchParam.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const t = norm(qDebounced);
        if (!t) return rows;
    return rows.filter((f: FaqItem) => {
      const hay = `${f.question} ${f.answer} ${f.category ?? ""}`.toLowerCase();
      return hay.includes(t);
    });
  }, [qDebounced, rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">FAQs</h1>
          <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            Create, edit, and deactivate FAQ entries used by the voice assistant.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
          <Button variant="primary" onClick={openCreate} disabled={loading}>
            New FAQ
          </Button>
        </div>
      </div>

      <FaqsFiltersBar
        q={q}
        setQ={setQuery}
        category={category}
        setCategory={setCategory}
        categories={categories}
        count={filtered.length}
      />

      {error ? <ErrorCard message={error} /> : null}

      {loading && rows.length === 0 ? (
        <SkeletonTable rows={6} />
      ) : (
        <FaqsTable rows={filtered} onEdit={openEdit} onDeactivate={deactivate} />
      )}

      {modalOpen ? (
        <FaqEditorModal
          title={editing ? "Edit FAQ" : "Create FAQ"}
          initial={{
            question: editing?.question ?? "",
            answer: editing?.answer ?? "",
            category: editing?.category ?? "",
          }}
          categories={categories}
          onClose={closeModal}
          onSave={save}
          saving={loading}
        />
      ) : null}
    </div>
  );
}