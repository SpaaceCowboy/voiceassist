"use client";

import { type RefObject } from "react";

export function Input({
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  type = "text",
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  type?: "text" | "email" | "password";
  // allow refs created with useRef<HTMLInputElement | null>(null)
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <input
      ref={inputRef}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`px-3 py-2 rounded-xl border text-sm ${className} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      style={{
        background: `rgb(var(--surface2))`,
        borderColor: `rgb(var(--border))`,
        color: `rgb(var(--text))`,
      }}
    />
  );
}
