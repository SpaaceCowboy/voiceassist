"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ArticleRevision } from "@/lib/types";

export function RevisionHistory({ articleId, initialRevisions }: { articleId: string; initialRevisions: ArticleRevision[] }) {
  const router = useRouter();
  const [revisions] = useState(initialRevisions);
  if (revisions.length === 0) return null;
  return <details className="mt-8 rounded-lg border border-line p-4"><summary className="cursor-pointer font-medium">Revision history ({revisions.length})</summary><ul className="mt-4 space-y-2">{revisions.map((revision) => <li key={revision.id} className="flex items-center justify-between text-sm"><time>{new Date(revision.createdAt).toLocaleString()}</time><button className="text-accent" onClick={async () => { await api.restoreArticleRevision(articleId, revision.id); router.refresh(); }}>Restore</button></li>)}</ul></details>;
}
