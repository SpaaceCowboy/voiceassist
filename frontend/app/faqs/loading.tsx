import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export default function FaqsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end gap-3">
        <div>
          <Skeleton className="h-6 w-20 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
      <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-72 rounded-xl" />
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
      </div>
      <SkeletonTable rows={6} />
    </div>
  );
}
