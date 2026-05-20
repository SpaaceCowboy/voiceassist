// Path: lib/search.ts
export function normalizeText(s: string): string {
    return s.toLowerCase().trim();
  }
  
  export function includesQuery(haystackParts: Array<string | null | undefined>, q: string): boolean {
    const t = normalizeText(q);
    if (!t) return true;
    const hay = haystackParts
      .filter((x): x is string => typeof x === "string" && x.length > 0)
      .join(" ")
      .toLowerCase();
    return hay.includes(t);
  }