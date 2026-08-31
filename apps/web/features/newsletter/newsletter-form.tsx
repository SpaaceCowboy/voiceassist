"use client";
import { FormEvent, useState } from "react";
import { subscribe } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
export function NewsletterForm() {
  const [status, setStatus] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setStatus(null);
    const form = event.currentTarget;
    try { await subscribe(String(new FormData(form).get("email"))); setStatus("Subscribed. Check your inbox on Friday."); form.reset(); }
    catch (error) { console.error("Newsletter subscription failed", error); setStatus("Subscription failed. Please try again."); }
    finally { setLoading(false); }
  }
  return <div><form className="flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
    <input name="email" type="email" required aria-label="Email address" placeholder="you@example.com" className="min-h-12 min-w-0 flex-1 rounded-lg border border-border-strong bg-background/80 px-4 backdrop-blur placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
    <button type="submit" disabled={loading} className={buttonVariants({ size: "lg" })}>{loading ? "Subscribing…" : "Subscribe"}</button>
  </form>{status && <p role="status" className="mt-2 text-sm text-muted-foreground">{status}</p>}</div>;
}
