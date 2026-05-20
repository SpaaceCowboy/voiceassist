// Path: components/ui/Card.tsx
import * as React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ children, className = "", style, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={`rounded-2xl border ${className}`}
      style={{
        background: `rgb(var(--surface))`,
        borderColor: `rgb(var(--border))`,
        ...(style ?? {}),
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="p-4 flex items-start justify-between gap-3">
      <div>
        <div className="text-lg font-semibold">{title}</div>
        {subtitle ? (
          <div className="text-sm" style={{ color: `rgb(var(--muted))` }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}

export function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-4 pt-0">{children}</div>;
}