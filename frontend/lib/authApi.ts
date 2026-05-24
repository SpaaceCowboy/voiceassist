// lib/authApi.ts

import { useAuthStore, type AuthUser } from "@/store/auth";

const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE ?? "cookie";

async function backendFetch(path: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init?.headers as Record<string, string>),
  };

  const res = await fetch(`/api/backend${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  return res;
}

function normalizeUser(raw: Record<string, unknown> | null): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;

  const email = String(raw.email ?? raw.emailAddress ?? "");
  if (!email) return null;

  const r = String(raw.role ?? "user").toLowerCase();
  const role = r === "admin" || r === "moderator" || r === "user"
    ? r
    : "user";

  const id = raw.id != null ? String(raw.id) : undefined;

  return { id, email, role };
}

export async function login(email: string, password: string) {
  const trimmedEmail = email.trim();

  if (!trimmedEmail || !password) {
    throw new Error("Email and password required");
  }

  const res = await backendFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: trimmedEmail,
      password,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.error ??
      data?.message ??
      `Login failed (${res.status})`;

    throw new Error(typeof msg === "string" ? msg : "Login failed");
  }

  const payload = data?.data ?? data;

  const userRaw =
    payload?.user ??
    data?.user ??
    (data?.email
      ? {
          email: data.email,
          role: data.role,
        }
      : null);

  const user = normalizeUser(userRaw);

  if (user) {
    useAuthStore.getState().setUser(user);
  } else {
    useAuthStore.getState().setUser({
      email: trimmedEmail,
      role: "user",
    });
  }

  useAuthStore.getState().setAuthenticated(true);
}

export async function getMe() {
  const res = await backendFetch("/auth/me", {
    method: "GET",
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json().catch(() => null);
  const payload = data?.data ?? data;

  return normalizeUser(payload?.user ?? payload);
}

export async function logout() {
  try {
    await backendFetch("/auth/logout", {
      method: "POST",
    });
  } catch {
    // ignore
  }

  useAuthStore.getState().logoutLocal();
}

export function getAuthToken(): string | null {
  return null;
}
