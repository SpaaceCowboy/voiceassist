"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@/components/ui/icons";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Apply theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      className="grid grid-cols-2 gap-1 rounded-xl border p-1 text-xs font-medium"
      style={{
        background: "rgb(var(--surface2))",
        borderColor: "rgb(var(--border))",
        color: "rgb(var(--text))",
      }}
      aria-label="Toggle dark mode"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span
        className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition"
        style={
          theme === "light"
            ? { background: "rgb(var(--surface))", color: "rgb(var(--text))", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }
            : { color: "rgb(var(--muted))" }
        }
      >
        <SunIcon size={14} /> Light
      </span>
      <span
        className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition"
        style={
          theme === "dark"
            ? { background: "rgb(var(--surface))", color: "rgb(var(--text))", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }
            : { color: "rgb(var(--muted))" }
        }
      >
        <MoonIcon size={14} /> Dark
      </span>
    </button>
  );
}
