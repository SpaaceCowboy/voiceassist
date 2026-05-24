// Path: app/faqs/page.tsx
import { Suspense } from "react";
import FaqsPageClient from "@/components/faqs/FaqsPageClient";

export default function FaqsPage() {
  return (
    <Suspense fallback={null}>
      <FaqsPageClient />
    </Suspense>
  );
}
