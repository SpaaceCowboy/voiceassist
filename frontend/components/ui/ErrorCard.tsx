// Path: components/ui/ErrorCard.tsx
import { Card } from "@/components/ui/Card";

export function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="p-3" style={{ borderColor: "rgba(239,68,68,0.35)" }}>
      <div className="text-sm" style={{ color: "rgb(239,68,68)" }}>
        {message}
      </div>
    </Card>
  );
}