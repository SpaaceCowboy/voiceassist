"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/icons";

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  backHref,
  icon,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-1.5 inline-flex items-center gap-1 text-xs transition hover:opacity-80"
            style={{ color: "rgb(var(--muted))" }}
          >
            <ArrowLeftIcon size={14} /> Back
          </Link>
        ) : null}
        <div className="flex items-center gap-2.5">
          {icon ? (
            <span
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                background: "rgba(var(--accent),0.12)",
                color: "rgb(var(--accent))",
              }}
            >
              {icon}
            </span>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {badge}
        </div>
        {subtitle ? (
          <p className="mt-1 text-sm" style={{ color: "rgb(var(--muted))" }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
