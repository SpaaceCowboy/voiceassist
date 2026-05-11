"use client";

export function Input({
  value,
  onChange,
  placeholder,
  className = "",
  disabled = false,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  type?: "text" | "email" | "password";
}) {
  return (
    <input
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
