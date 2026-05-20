// Path: components/appointments/list/AppointmentStatusPill.tsx
export function AppointmentStatusPill({ value }: { value: string }) {
    const s = value.toLowerCase();
  
    const cls =
      s.includes("cancel")
        ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200"
        : s.includes("complete")
          ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-200"
          : s.includes("no_show")
            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
            : s.includes("checked") || s.includes("progress") || s.includes("confirm")
              ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200"
              : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200";
  
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${cls}`}>
        {value || "—"}
      </span>
    );
  }