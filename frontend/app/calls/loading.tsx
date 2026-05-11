import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export default function CallsLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-72 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <SkeletonTable rows={8} />
    </div>
  );
}
