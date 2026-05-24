// Path: app/appointments/page.tsx
import { Suspense } from "react";
import AppointmentsPageClient from "@/components/appointments/AppointmentsPageClient";

export default function AppointmentsPage() {
  return (
    <Suspense fallback={null}>
      <AppointmentsPageClient />
    </Suspense>
  );
}
