import { getAuthToken } from "@/lib/authApi";

export type Role = "moderator" | "user";

export type RegisterUserRequest = {
  email: string;
  password: string;
  fullName: string;
  role: Role;
};

export type RegisterUserResponse = {
  success: boolean;
  message?: string;
  data?: {
    user?: {
      id: number;
      email: string;
      fullName: string;
      role: Role;
      createdAt?: string;
    };
  };
  error?: string;
};

export type ChangePasswordRequest = {
  password: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    "content-type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseTextSafe(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t || "";
  } catch {
    return "";
  }
}

export async function registerUser(payload: RegisterUserRequest): Promise<RegisterUserResponse> {
  const res = await fetch("/api/backend/auth/register", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const text = await parseTextSafe(res);
  const json: unknown = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;

  if (!res.ok) {
    const msg =
      (typeof json === "object" && json && "error" in json && typeof (json as { error: unknown }).error === "string")
        ? (json as { error: string }).error
        : `Register failed (${res.status})`;
    return { success: false, error: msg };
  }

  return (json as RegisterUserResponse) ?? { success: true };
}

export async function changeMyPassword(payload: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const res = await fetch("/api/backend/auth/password", {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const text = await parseTextSafe(res);
  const json: unknown = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;

  if (!res.ok) {
    const msg =
      (typeof json === "object" && json && "error" in json && typeof (json as { error: unknown }).error === "string")
        ? (json as { error: string }).error
        : `Change password failed (${res.status})`;
    return { success: false, error: msg };
  }

  return (json as ChangePasswordResponse) ?? { success: true };
}