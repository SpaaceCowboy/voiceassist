import PatientDetailClient from "@/components/patients/PatientDetailClient";
export default function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <PatientDetailClient id={params.id} />;
}
