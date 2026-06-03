"use client";

import {
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import Link from "next/link";
import { gsap } from "gsap";

import { usePrefersReducedMotion, useIsDark } from "./hooks";
import {
  PhoneIcon,
  CalendarIcon,
  HeartPulseIcon,
  HelpIcon,
  ChartIcon,
  ShieldIcon,
  SparkIcon,
  CheckCircleIcon,
  ActivityIcon,
  SunIcon,
  MoonIcon,
} from "@/components/ui/icons";

export const ICONS: Record<
  string,
  (p: { size?: number; className?: string }) => ReactNode
> = {
  PhoneIcon,
  CalendarIcon,
  HeartPulseIcon,
  HelpIcon,
  ChartIcon,
  ShieldIcon,
  SparkIcon,
  CheckCircleIcon,
  ActivityIcon,
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/* -------------------------------------------------------------------- */
/* Clay surface                                                          */
/* -------------------------------------------------------------------- */
export function ClayCard({
  children,
  className = "",
  interactive = false,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      {...rest}
      className={[
        "bg-clay-surface rounded-clay border shadow-clay",
        interactive
          ? "transition duration-200 hover:-translate-y-1 hover:shadow-clay-hover"
          : "",
        className,
      ].join(" ")}
      style={{ borderColor: "var(--clay-border)", ...style }}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* Clay pill (eyebrow / chips)                                           */
/* -------------------------------------------------------------------- */
export function ClayPill({
  children,
  className = "",
  ...rest
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...rest}
      className={`bg-clay-surface inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-clay ${className}`}
      style={{ borderColor: "var(--clay-border)" }}
    >
      {children}
    </span>
  );
}

export function AccentDot({ pulse = true }: { pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      {pulse && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ background: "rgb(var(--accent))" }}
        />
      )}
      <span
        className="relative inline-flex h-2.5 w-2.5 rounded-full"
        style={{ background: "rgb(var(--accent))" }}
      />
    </span>
  );
}

/* -------------------------------------------------------------------- */
/* Clay button — magnetic + press-squish (primary), lift (ghost)        */
/* -------------------------------------------------------------------- */
const PRIMARY_GLOW =
  "0 12px 28px -6px rgba(var(--accent),0.50), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.18)";
const PRIMARY_GLOW_PRESSED =
  "0 4px 12px -4px rgba(var(--accent),0.45), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -2px 5px rgba(0,0,0,0.22)";

export function ClayButton({
  href,
  children,
  variant = "primary",
  className = "",
  onClick,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = usePrefersReducedMotion();
  const magnetic = variant === "primary" && !reduce;

  useEffect(() => {
    const el = ref.current;
    if (!el || !magnetic) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      xTo(clamp(mx * 0.35, -8, 8));
      yTo(clamp(my * 0.35, -8, 8));
    };
    const onEnter = () => gsap.to(el, { scale: 1.03, duration: 0.25, ease: "power2.out" });
    const onLeave = () => {
      xTo(0);
      yTo(0);
      gsap.to(el, { scale: 1, duration: 0.35, ease: "power2.out" });
      el.style.boxShadow = PRIMARY_GLOW;
    };
    const onDown = () => {
      gsap.to(el, { scale: 0.97, duration: 0.1 });
      el.style.boxShadow = PRIMARY_GLOW_PRESSED;
    };
    const onUp = () => {
      gsap.to(el, { scale: 1.03, duration: 0.12 });
      el.style.boxShadow = PRIMARY_GLOW;
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      gsap.set(el, { x: 0, y: 0, scale: 1 });
    };
  }, [magnetic]);

  if (variant === "primary") {
    return (
      <Link
        ref={ref}
        href={href}
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white will-change-transform ${className}`}
        style={{
          background:
            "linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent2)) 100%)",
          boxShadow: PRIMARY_GLOW,
        }}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      ref={ref}
      href={href}
      onClick={onClick}
      className={`clay-press bg-clay-surface inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold shadow-clay transition hover:shadow-clay-hover ${className}`}
      style={{ borderColor: "var(--clay-border)", color: "rgb(var(--text))" }}
    >
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------- */
/* Wordmark + theme toggle                                              */
/* -------------------------------------------------------------------- */
export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        className="grid h-9 w-9 place-items-center rounded-xl text-[15px] font-bold text-white"
        style={{
          background:
            "linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent2)) 100%)",
          boxShadow: "0 6px 16px rgba(var(--accent),0.35)",
        }}
      >
        V
      </span>
      <span className="text-[17px] font-semibold tracking-tight">
        Voice<span style={{ color: "rgb(var(--accent))" }}>Assist</span>
      </span>
    </Link>
  );
}

export function ThemeButton() {
  const dark = useIsDark();
  const toggle = () => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="clay-press bg-clay-surface grid h-10 w-10 place-items-center rounded-full border shadow-clay"
      style={{ borderColor: "var(--clay-border)", color: "rgb(var(--text))" }}
    >
      {dark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  );
}

/* -------------------------------------------------------------------- */
/* Section heading                                                       */
/* -------------------------------------------------------------------- */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <div
          data-reveal
          className="mb-3 text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: "rgb(var(--accent))" }}
        >
          {eyebrow}
        </div>
      )}
      <h2
        data-reveal
        className="text-3xl font-bold tracking-tight sm:text-4xl"
      >
        {title}
      </h2>
      {subtitle && (
        <p
          data-reveal
          className="mx-auto mt-4 max-w-xl text-base"
          style={{ color: "rgb(var(--muted))" }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
