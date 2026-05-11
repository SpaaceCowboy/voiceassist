import AppointmentDetailClient from "@/components/appointments/AppointmentDetailClient";

export default function AppointmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <AppointmentDetailClient id={params.id} />;
}
