export function Badge({
  text,
  tone = "neutral",
}: {
  text: string;
  tone?: "neutral" | "good" | "warn" | "bad" | "accent";
}) {
  const map: Record<string, string> = {
    neutral: "rgba(100,116,139,0.14)",
    good: "rgba(34,197,94,0.14)",
    warn: "rgba(245,158,11,0.16)",
    bad: "rgba(239,68,68,0.14)",
    accent: `rgba(${getComputedStyleSafe("--accent")},0.14)`,
  };

  function getToneBg() {
    if (tone === "accent") return `rgba(var(--accent), 0.14)`;
    return map[tone] || map.neutral;
  }

  return (
    <span
      className="inline-flex px-2 py-1 rounded-full text-xs border"
      style={{
        background: getToneBg(),
        borderColor: `rgb(var(--border))`,
        color: `rgb(var(--text))`,
      }}
    >
      {text}
    </span>
  );
}

function getComputedStyleSafe(_var: string) {
  // not used directly; kept to avoid TS complaints if you refactor
  return "139,92,246";
}
