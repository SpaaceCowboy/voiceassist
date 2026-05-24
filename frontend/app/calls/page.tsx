// Path: app/calls/page.tsx
import { Suspense } from "react";
import CallsPageClient from "@/components/calls/CallsPageClient";

export default function CallsPage() {
  return (
    <Suspense fallback={null}>
      <CallsPageClient />
    </Suspense>
  );
}
