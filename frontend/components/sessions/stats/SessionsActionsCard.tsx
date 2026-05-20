// Path: components/sessions/stats/SessionsActionsCard.tsx
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function SessionsActionsCard({
  cleaning,
  onCleanup,
  cleanupResult,
  onClearResult,
}: {
  cleaning: boolean;
  onCleanup: () => void;
  cleanupResult: string | null;
  onClearResult: () => void;
}) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">Cleanup</div>
          <div className="text-xs" style={{ color: "rgb(var(--muted))" }}>
            Removes stale conversation sessions (moderator only).
          </div>
        </div>

        <Button variant="primary" onClick={onCleanup} disabled={cleaning}>
          {cleaning ? "Cleaning…" : "Run cleanup"}
        </Button>
      </div>

      {cleanupResult ? (
        <div className="text-sm flex items-center justify-between gap-3">
          <div style={{ color: "rgb(var(--text))" }}>{cleanupResult}</div>
          <Button variant="ghost" onClick={onClearResult}>
            Dismiss
          </Button>
        </div>
      ) : null}
    </Card>
  );
}