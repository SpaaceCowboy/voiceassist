"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthBrand } from "@/components/auth/AuthBrand";
import { login } from "@/lib/authApi";
import { useAuthStore, type AuthState } from "@/store/auth";

function safeNextPath(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  return raw;
}

function readNextFromLocation(): string {
  if (typeof window === "undefined") return "/dashboard";
  const sp = new URLSearchParams(window.location.search);
  return safeNextPath(sp.get("next"));
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
            Loading…
          </div>
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();

  const user = useAuthStore((s: AuthState) => s.user);
  const hydrated = useAuthStore((s: AuthState) => s.hydrated);

  const [nextPath, setNextPath] = useState<string>("/dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // read query param on client only (avoids Next.js Suspense requirement)
    setNextPath(readNextFromLocation());
  }, []);

  useEffect(() => {
    if (hydrated && user) {
      router.replace(nextPath);
    }
  }, [hydrated, user, router, nextPath]);

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace(nextPath);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-sm" style={{ color: "rgb(var(--muted))" }}>
          Loading…
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="w-full max-w-sm">
      <Card className="p-6">
        <AuthBrand subtitle="Sign in to your dashboard" />
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs" style={{ color: "rgb(var(--muted))" }}>
              Email
            </span>
            <Input type="email" value={email} onChange={setEmail} placeholder="you@example.com" className="w-full" />
          </label>
          <label className="block">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs" style={{ color: "rgb(var(--muted))" }}>
                Password
              </span>
              <Link href="/login/forgot-password" className="text-xs" style={{ color: "rgb(var(--accent))" }}>
                Forgot?
              </Link>
            </div>
            <Input type="password" value={password} onChange={setPassword} placeholder="••••••••" className="w-full" />
          </label>

          {err ? (
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", color: "rgb(239,68,68)" }}
            >
              {err}
            </div>
          ) : null}

          <Button type="submit" variant="primary" fullWidth size="lg" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-center text-sm" style={{ color: "rgb(var(--muted))" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "rgb(var(--accent))" }}>
              Sign up
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
