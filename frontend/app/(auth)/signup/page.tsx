"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/backend/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullName: name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.error ?? data?.message ?? `Sign up failed: ${res.status}`;
        throw new Error(msg);
      }
      router.push("/login?registered=1");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm p-6">
      <h1 className="text-xl font-semibold mb-1">Create account</h1>
      <p
        className="text-sm mb-6"
        style={{ color: "rgb(var(--muted))" }}
      >
        Sign up to access the dashboard.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span
            className="block text-xs mb-1"
            style={{ color: "rgb(var(--muted))" }}
          >
            Full name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
            autoComplete="name"
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{
              background: "rgb(var(--surface2))",
              borderColor: "rgb(var(--border))",
              color: "rgb(var(--text))",
            }}
          />
        </label>

        <label className="block">
          <span
            className="block text-xs mb-1"
            style={{ color: "rgb(var(--muted))" }}
          >
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{
              background: "rgb(var(--surface2))",
              borderColor: "rgb(var(--border))",
              color: "rgb(var(--text))",
            }}
          />
        </label>

        <label className="block">
          <span
            className="block text-xs mb-1"
            style={{ color: "rgb(var(--muted))" }}
          >
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{
              background: "rgb(var(--surface2))",
              borderColor: "rgb(var(--border))",
              color: "rgb(var(--text))",
            }}
          />
        </label>

        <label className="block">
          <span
            className="block text-xs mb-1"
            style={{ color: "rgb(var(--muted))" }}
          >
            Confirm password
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{
              background: "rgb(var(--surface2))",
              borderColor: "rgb(var(--border))",
              color: "rgb(var(--text))",
            }}
          />
        </label>

        {err ? (
          <div
            className="text-sm py-2 px-3 rounded-lg"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "rgb(239,68,68)",
            }}
          >
            {err}
          </div>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full py-3"
        >
          {loading ? "Creating account…" : "Sign up"}
        </Button>

        <p
          className="text-center text-sm"
          style={{ color: "rgb(var(--muted))" }}
        >
          Already have an account?{" "}
          <Link href="/login" style={{ color: "rgb(var(--accent))" }}>
            Log in
          </Link>
        </p>
      </form>
    </Card>
  );
}
