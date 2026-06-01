"use client";

import * as React from "react";
import Link from "next/link";

type Variant = "primary" | "ghost" | "danger" | "outline" | "subtle";
type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs gap-1.5",
  md: "px-3 py-2 text-sm gap-2",
  lg: "px-4 py-2.5 text-sm gap-2",
};

const VARIANT_STYLE: Record<Variant, React.CSSProperties> = {
  ghost: {
    background: "rgb(var(--surface2))",
    borderColor: "rgb(var(--border))",
    color: "rgb(var(--text))",
  },
  subtle: {
    background: "transparent",
    borderColor: "transparent",
    color: "rgb(var(--muted))",
  },
  outline: {
    background: "transparent",
    borderColor: "rgb(var(--border))",
    color: "rgb(var(--text))",
  },
  primary: {
    background: "rgb(var(--accent))",
    borderColor: "rgb(var(--accent))",
    color: "white",
  },
  danger: {
    background: "rgba(239,68,68,0.12)",
    borderColor: "rgba(239,68,68,0.30)",
    color: "rgb(239,68,68)",
  },
};

type CommonProps = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  title?: string;
};

type ButtonAsButton = CommonProps & {
  href?: undefined;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
};

type ButtonAsLink = CommonProps & {
  href: string;
  onClick?: () => void;
};

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const {
    children,
    variant = "ghost",
    size = "md",
    className = "",
    icon,
    iconRight,
    fullWidth,
    title,
  } = props;

  const base =
    "inline-flex items-center justify-center font-medium rounded-xl border transition active:scale-[0.98] focus-visible:outline-none";
  const cls = `${base} ${SIZES[size]} ${fullWidth ? "w-full" : ""} ${className}`;
  const style = VARIANT_STYLE[variant];

  const inner = (
    <>
      {icon ? <span className="shrink-0 -ml-0.5 inline-flex">{icon}</span> : null}
      <span className="truncate">{children}</span>
      {iconRight ? <span className="shrink-0 -mr-0.5 inline-flex">{iconRight}</span> : null}
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls} style={style} title={title} onClick={props.onClick}>
        {inner}
      </Link>
    );
  }

  const { onClick, disabled, type = "button" } = props as ButtonAsButton;
  return (
    <button
      type={type}
      title={title}
      className={`${cls} ${disabled ? "opacity-55 cursor-not-allowed active:scale-100" : ""}`}
      style={style}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {inner}
    </button>
  );
}
