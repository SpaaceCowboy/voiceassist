"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Comment } from "@/lib/types";

export function Comments({ slug, initialComments, locale = "en" }: { slug: string; initialComments: Comment[]; locale?: "en" | "fa" }) {
  const fa = locale === "fa";
  const [comments] = useState(initialComments);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(fa ? "در حال ارسال…" : "Submitting…");
    try {
      const response = await api.submitComment(slug, { name, email, body, website });
      setStatus(response.data.message);
      setBody("");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to submit comment"); }
  }

  return <section className="mx-auto max-w-3xl py-14"><h2 className="font-serif text-2xl font-semibold">{fa ? "گفت‌وگو" : "Discussion"}</h2><div className="mt-6 space-y-5">{comments.map((comment) => <article key={comment.id} className="rounded-lg border border-line p-4"><div className="flex justify-between text-sm"><strong>{comment.name}</strong><time className="text-ink-muted">{new Date(comment.createdAt).toLocaleDateString(fa ? "fa-IR" : "en")}</time></div><p className="mt-2 whitespace-pre-wrap text-ink-soft">{comment.body}</p></article>)}{comments.length === 0 && <p className="text-sm text-ink-muted">{fa ? "هنوز دیدگاه تأییدشده‌ای وجود ندارد." : "No approved comments yet."}</p>}</div><form onSubmit={submit} className="mt-8 space-y-3 rounded-xl border border-line bg-paper-card p-5"><h3 className="font-medium">{fa ? "ثبت دیدگاه" : "Leave a comment"}</h3><div className="grid gap-3 sm:grid-cols-2"><input value={name} onChange={(event) => setName(event.target.value)} placeholder={fa ? "نام" : "Name"} className="rounded border border-line px-3 py-2" required /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={fa ? "ایمیل (نمایش داده نمی‌شود)" : "Email (not published)"} className="rounded border border-line px-3 py-2" required /></div><input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" /><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={fa ? "دیدگاه شما" : "Your comment"} rows={4} className="w-full rounded border border-line px-3 py-2" required /><button className="rounded bg-accent px-5 py-2 text-paper">{fa ? "ارسال برای بررسی" : "Submit for review"}</button>{status && <p className="text-sm text-ink-muted">{status}</p>}</form></section>;
}
