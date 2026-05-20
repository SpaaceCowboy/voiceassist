// Path: components/ui/TableShell.tsx
import * as React from "react";

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "rgb(var(--surface))",
        borderColor: "rgb(var(--border))",
      }}
    >
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead
      className="text-xs uppercase tracking-wide"
      style={{ background: "rgb(var(--surface2))" }}
    >
      {children}
    </thead>
  );
}

// ✅ TH now accepts real <th> props, including style, colSpan, etc.
export function TH({
  className = "",
  widthClass = "",
  children,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement> & { widthClass?: string }) {
  return (
    <th {...rest} className={`text-left p-3 ${widthClass} ${className}`}>
      {children}
    </th>
  );
}

export function TR({
  children,
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...rest}
      className={`border-t border-black/10 dark:border-white/10 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] ${className}`}
    >
      {children}
    </tr>
  );
}

// ✅ TD now accepts real <td> props, including colSpan
export function TD({
  className = "",
  children,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...rest} className={`p-3 ${className}`}>
      {children}
    </td>
  );
}