// Path: components/analytics/hourly/HourlyTable.tsx
import { TableShell, THead, TH, TR, TD } from "@/components/ui/TableShell";
import type { HourlyAnalytics } from "@/lib/types";

export function HourlyTable({ rows }: { rows: HourlyAnalytics[] }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Hourly distribution</div>
      <TableShell>
        <THead>
          <tr>
            <TH>Hour</TH>
            <TH>Calls</TH>
            <TH>Appointments</TH>
            <TH>Transfers</TH>
          </tr>
        </THead>
        <tbody>
          {rows.map((r) => (
            <TR key={r.hour}>
              <TD className="font-medium">{r.hour}:00</TD>
              <TD>{r.calls}</TD>
              <TD>{r.appointments}</TD>
              <TD>{r.transfers}</TD>
            </TR>
          ))}
          {rows.length === 0 ? (
            <TR>
              <TD colSpan={4} className="p-6 text-center">
                <span className="text-sm" style={{ color: "rgb(var(--muted))" }}>
                  No hourly data.
                </span>
              </TD>
            </TR>
          ) : null}
        </tbody>
      </TableShell>
    </div>
  );
}