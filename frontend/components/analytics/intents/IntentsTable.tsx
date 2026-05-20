// Path: components/analytics/intents/IntentsTable.tsx
import { TableShell, THead, TH, TR, TD } from "@/components/ui/TableShell";
import type { IntentAnalytics } from "@/lib/types";

export function IntentsTable({ rows }: { rows: IntentAnalytics[] }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Intent breakdown</div>
      <TableShell>
        <THead>
          <tr>
            <TH>Intent</TH>
            <TH>Count</TH>
            <TH>Percentage</TH>
            <TH>Avg Duration (s)</TH>
          </tr>
        </THead>
        <tbody>
          {rows.map((r, idx) => (
            <TR key={`${r.intent}-${idx}`}>
              <TD className="font-medium">{r.intent}</TD>
              <TD>{r.count}</TD>
              <TD>{r.percentage}%</TD>
              <TD>{r.avg_duration_seconds}</TD>
            </TR>
          ))}
          {rows.length === 0 ? (
            <TR>
              <TD colSpan={4} className="p-6 text-center">
                <span className="text-sm" style={{ color: "rgb(var(--muted))" }}>
                  No intent data.
                </span>
              </TD>
            </TR>
          ) : null}
        </tbody>
      </TableShell>
    </div>
  );
}