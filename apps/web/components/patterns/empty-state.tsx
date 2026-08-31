import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
export function EmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="col-span-full border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
      <SearchX className="mx-auto text-muted-foreground" />
      <h3 className="editorial mt-4 text-2xl font-semibold">
        No building blocks found
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Try removing a filter or searching for a broader outcome.
      </p>
      {onReset && (
        <Button variant="secondary" className="mt-5" onClick={onReset}>
          Clear all filters
        </Button>
      )}
    </div>
  );
}
