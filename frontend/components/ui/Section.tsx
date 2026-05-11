"use client";

import { useState } from "react";
import { Button } from "./Button";

export function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-2xl border transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: `rgb(var(--surface))`,
        borderColor: `rgb(var(--border))`,
      }}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <Button variant="ghost" onClick={() => setOpen(!open)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>
      {open ? <div className="p-4 pt-0">{children}</div> : null}
    </div>
  );
}
