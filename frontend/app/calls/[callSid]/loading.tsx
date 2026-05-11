import { Skeleton } from "@/components/ui/Skeleton";

export default function CallDetailLoading() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
        <div className="flex justify-between mb-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-16 rounded-xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
