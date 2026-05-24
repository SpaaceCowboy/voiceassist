"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader title="Admin Login" subtitle="ByteForge ERP" />
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-3">
              <Input
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Email"
              />
              <Input
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Password"
              />
              {err ? (
                <div className="text-sm text-red-600 dark:text-red-200">
                  {err}
                </div>
              ) : null}
              <Button type="submit" variant="primary" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-sm" style={{ color: "rgb(var(--muted))" }}>
                Don&apos;t have an account?{" "}
                <Link href="/signup" style={{ color: "rgb(var(--accent))" }}>
                  Sign up
                </Link>
              </p>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
