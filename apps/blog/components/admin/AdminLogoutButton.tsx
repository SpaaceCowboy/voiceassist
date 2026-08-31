"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await api.logoutAdmin();
    } finally {
      router.replace("/admin/login");
      router.refresh();
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={logout} disabled={busy} className="text-sm text-ink-soft hover:text-accent disabled:opacity-50">
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
