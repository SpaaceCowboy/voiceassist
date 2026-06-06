import { Suspense } from "react";
import { LogsPageClient } from "@/components/logs/LogsPageClient";

export const dynamic = "force-dynamic";

export default function LogsPage() {
  return (
    <Suspense fallback={null}>
      <LogsPageClient />
    </Suspense>
  );
}
