import * as React from "react";

/** A labelled value tile used on detail pages. */
export function Field({
  label,
  value,
  icon,
  mono,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  const empty = value == null || value === "" || value === "—";
  return (
    <div
      className={`rounded-xl border p-3 ${className}`}
      style={{ background: "rgb(var(--surface2))", borderColor: "rgb(var(--border))" }}
    >
      <div
        className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide"
        style={{ color: "rgb(var(--muted))" }}
      >
        {icon ? <span className="inline-flex opacity-80">{icon}</span> : null}
        {label}
      </div>
      <div
        className={`mt-1 text-sm font-medium ${mono ? "font-mono" : ""}`}
        style={empty ? { color: "rgb(var(--muted))" } : undefined}
      >
        {empty ? "Not set" : value}
      </div>
    </div>
  );
}

export function FieldGrid({
  children,
  cols = 3,
  className = "",
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const colClass =
    cols === 2
      ? "sm:grid-cols-2"
      : cols === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";
  return <div className={`grid grid-cols-1 gap-3 ${colClass} ${className}`}>{children}</div>;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Initials avatar with a deterministic accent gradient. */
export function Avatar({
  name,
  size = 48,
}: {
  name: string;
  size?: number;
}) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-2xl font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        background:
          "linear-gradient(135deg, rgb(var(--accent)) 0%, rgba(var(--accent),0.7) 100%)",
        boxShadow: "0 4px 14px rgba(var(--accent),0.30)",
      }}
    >
      {initials(name)}
    </div>
  );
}
