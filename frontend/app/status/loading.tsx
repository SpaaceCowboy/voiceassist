import { Skeleton, SkeletonStatusTable } from "@/components/ui/Skeleton";

export default function StatusLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
        <Skeleton className="h-6 w-28 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <SkeletonStatusTable rows={8} />
    </div>
  );
}
