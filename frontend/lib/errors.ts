// Path: lib/errors.ts
export function formatApiError(e: unknown): string {
    if (e instanceof Error) return e.message;
    return String(e);
  }