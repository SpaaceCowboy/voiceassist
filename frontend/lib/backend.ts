// lib/backend.ts

export class BackendError extends Error {
  status: number;
  bodyText: string;
  constructor(status: number, bodyText: string) {
    super(`BackendError ${status}: ${bodyText}`);
    this.status = status;
    this.bodyText = bodyText;
  }
}

function getAuthHeader(): Record<string, string> {
  // Only works in browser (client components). For server components, prefer cookie mode later.
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("auth-token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function getDataSource() {
  const source =
    process.env.DATA_SOURCE ?? process.env.NEXT_PUBLIC_DATA_SOURCE ?? "backend";
  return source.toLowerCase() === "mock" ? "mock" : "backend";
}

function withLeadingSlash(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function normalizeApiPath(path: string, source: "mock" | "backend") {
  const normalized = withLeadingSlash(path);
  if (source === "mock") {
    // Pages can keep using "/api/..." regardless of source.
    return normalized.startsWith("/api/")
      ? normalized.replace("/api", "")
      : normalized;
  }
  return normalized;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const source = getDataSource();
  const base = "/api/backend";
  const targetPath = normalizeApiPath(path, source);

  const headers: HeadersInit = {
    "content-type": "application/json",
    ...getAuthHeader(),
    ...(init?.headers || {}),
  };

  const res = await fetch(`${base}${targetPath}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new BackendError(res.status, text);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return (await res.text()) as T;
  }
  return (await res.json()) as T;
}

export const backendGet = <T>(path: string) =>
  request<T>(path, { method: "GET" });
export const backendPost = <T>(path: string, data: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(data) });
export const backendPut = <T>(path: string, data: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(data) });
export const backendPatch = <T>(path: string, data: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(data) });
export const backendDelete = <T>(path: string) =>
  request<T>(path, { method: "DELETE" });
