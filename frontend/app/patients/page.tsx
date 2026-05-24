// Path: app/patients/page.tsx
import { Suspense } from "react";
import PatientsPageClient from "@/components/patients/PatientsPageClient";

export default function PatientsPage() {
  return (
    <Suspense fallback={null}>
      <PatientsPageClient />
    </Suspense>
  );
}
