export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-black/5 dark:bg-white/10 ${className}`}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return <Skeleton className="h-24 rounded-2xl" />;
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgb(var(--border))" }}>
      <div className="p-3" style={{ background: "rgb(var(--surface2))" }}>
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="p-3 space-y-3" style={{ background: "rgb(var(--surface))" }}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonButton({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-10 w-24 rounded-xl ${className}`} />;
}

/** Skeleton for the Status page table (6 columns) */
export function SkeletonStatusTable({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgb(var(--border))" }}>
      <table className="w-full text-sm">
        <thead style={{ background: "rgb(var(--surface2))" }}>
          <tr>
            {["Endpoint", "Method", "Path", "Status", "Latency", "Preview"].map((h) => (
              <th key={h} className="text-left p-2">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ background: "rgb(var(--surface))" }}>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-t" style={{ borderColor: "rgb(var(--border))" }}>
              <td className="p-2"><Skeleton className="h-4 w-20" /></td>
              <td className="p-2"><Skeleton className="h-4 w-12" /></td>
              <td className="p-2"><Skeleton className="h-4 w-32" /></td>
              <td className="p-2"><Skeleton className="h-5 w-10 rounded-full" /></td>
              <td className="p-2"><Skeleton className="h-4 w-12" /></td>
              <td className="p-2"><Skeleton className="h-16 w-24 rounded" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Page-level skeleton: header + content area */
export function SkeletonPage({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4" style={{ background: "rgb(var(--surface))", borderColor: "rgb(var(--border))" }}>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      {children ?? <SkeletonTable rows={8} />}
    </div>
  );
}