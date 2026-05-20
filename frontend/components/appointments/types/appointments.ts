// Path: components/appointments/types/appointments.ts
export const APPOINTMENT_STATUSES = [
    "scheduled",
    "confirmed",
    "checked_in",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
    "rescheduled",
  ] as const;
  
  export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
  export type AppointmentStatusFilter = "" | AppointmentStatus;
  
  export type DateScope = "today" | "date" | "all";
  
  export function todayISO(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }