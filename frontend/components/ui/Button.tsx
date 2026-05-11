"use client";

type Variant = "primary" | "ghost" | "danger";

export function Button({
  children,
  onClick,
  variant = "ghost",
  disabled,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const base =
    "px-3 py-2 rounded-xl text-sm border transition active:scale-[0.99]";
  const styles: Record<Variant, React.CSSProperties> = {
    ghost: {
      background: `rgb(var(--surface2))`,
      borderColor: `rgb(var(--border))`,
      color: `rgb(var(--text))`,
    },
    primary: {
      background: `rgb(var(--accent))`,
      borderColor: `rgb(var(--accent))`,
      color: "white",
    },
    danger: {
      background: "rgba(239,68,68,0.12)",
      borderColor: "rgba(239,68,68,0.25)",
      color: "rgb(var(--text))",
    },
  };

  return (
    <button
      type={type}
      className={`${base} ${className} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      style={styles[variant]}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
