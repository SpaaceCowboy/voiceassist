// lib/authApi.ts

import { useAuthStore, type AuthUser } from "@/store/auth";

const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE ?? "token";
const LOCAL_ADMIN_PASSWORD = process.env.LOCAL_ADMIN_PASSWORD;

const TOKEN_KEY = "auth-token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setTokenStorage(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function clearTokenStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = "auth-token=; path=/; max-age=0; SameSite=Lax";
}

async function backendFetch(path: string, init?: RequestInit) {
  const token = getToken();
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (AUTH_MODE === "token" && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`/api/backend${path}`, {
    ...init,
    headers,
    credentials: AUTH_MODE === "cookie" ? "include" : undefined,
  });
  return res;
}

function normalizeUser(raw: Record<string, unknown> | null): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const email = String(raw.email ?? raw.emailAddress ?? "");
  if (!email) return null;
  const r = String(raw.role ?? "user").toLowerCase();
  const role = r === "admin" || r === "moderator" || r === "user" ? r : "user";
  const id = raw.id != null ? String(raw.id) : undefined;
  return { id, email, role };
}

export async function login(email: string, password: string) {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password)
    throw new Error("Email and password required");

  // Local fallback when backend is unavailable
  if (LOCAL_ADMIN_PASSWORD && password === LOCAL_ADMIN_PASSWORD) {
    const fakeToken = `local_${Date.now()}`;
    setTokenStorage(fakeToken);
    useAuthStore.getState().setToken(fakeToken);
    useAuthStore.getState().setUser({
      email: trimmedEmail,
      role: "admin",
    });
    return;
  }

  const res = await backendFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: trimmedEmail, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error ?? data?.message ?? `Login failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : "Login failed");
  }

  const payload = data?.data ?? data;
  const token = payload?.token ?? data?.token;
  const userRaw =
    payload?.user ??
    data?.user ??
    (data?.email ? { email: data.email, role: data.role } : null);
  const user = normalizeUser(userRaw);

  if (AUTH_MODE === "token" && token) {
    setTokenStorage(token);
    useAuthStore.getState().setToken(token);
  }

  if (user) {
    useAuthStore.getState().setUser(user);
  } else if (trimmedEmail) {
    useAuthStore.getState().setUser({ email: trimmedEmail, role: "user" });
  }
}

export async function getMe() {
  const res = await backendFetch("/auth/me", { method: "GET" });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const payload = data?.data ?? data;
  return normalizeUser(payload?.user ?? payload);
}

export async function logout() {
  try {
    await backendFetch("/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  clearTokenStorage();
  useAuthStore.getState().logoutLocal();
}

export function getAuthToken(): string | null {
  return getToken();
}
