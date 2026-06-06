export default function LoadingLogs() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="h-9 w-9 animate-pulse rounded-xl" style={{ background: "rgb(var(--surface2))" }} />
        <span className="h-7 w-44 animate-pulse rounded-lg" style={{ background: "rgb(var(--surface2))" }} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl" style={{ background: "rgb(var(--surface2))" }} />
        ))}
      </div>
      <div className="h-20 animate-pulse rounded-2xl" style={{ background: "rgb(var(--surface2))" }} />
      <div className="h-[calc(100vh-22rem)] min-h-[20rem] animate-pulse rounded-2xl" style={{ background: "rgb(var(--surface2))" }} />
    </div>
  );
}
