import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export default function ReservationsLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <SkeletonTable rows={8} />
    </div>
  );
}
