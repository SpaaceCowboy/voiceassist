import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
          <Skeleton className="h-5 w-28 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
          <Skeleton className="h-5 w-24 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
