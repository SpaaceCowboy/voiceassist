"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/backend/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? `Request failed: ${res.status}`);
      }
      setSent(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold mb-1">Check your email</h1>
        <p
          className="text-sm mb-6"
          style={{ color: "rgb(var(--muted))" }}
        >
          If an account exists for {email}, you&apos;ll receive instructions to reset your password.
        </p>
        <Link href="/login">
          <Button variant="ghost" className="w-full">
            Back to login
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm p-6">
      <h1 className="text-xl font-semibold mb-1">Forgot password</h1>
      <p
        className="text-sm mb-6"
        style={{ color: "rgb(var(--muted))" }}
      >
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          {loading ? "Sending…" : "Send reset link"}
        </Button>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm"
            style={{ color: "rgb(var(--muted))" }}
          >
            Back to login
          </Link>
        </div>
      </form>
    </Card>
  );
}
