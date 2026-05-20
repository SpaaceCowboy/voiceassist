// Path: lib/clientQuery.ts

export function safeInternalPath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw;
}

export function readQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  const sp = new URLSearchParams(window.location.search);
  const v = sp.get(name);
  return v && v.trim() ? v.trim() : null;
}
