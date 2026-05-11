export function StatusPill({ value }: { value: string }) {
    const v = (value || "").toLowerCase();
  
    const cls =
      v.includes("cancel")
        ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200"
        : v.includes("complete")
        ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-200"
        : v.includes("no_show") || v.includes("noshow")
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
        : "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200";
  
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${cls}`}>
        {value || "—"}
      </span>
    );
  }