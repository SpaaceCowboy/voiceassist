"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { BOOKMARKS_KEY, HISTORY_KEY, type LocalSavedArticle, readLocalLibrary } from "@/lib/readerLibrary";
import { usePathname } from "next/navigation";
import { localePath } from "@/lib/i18n";

export default function LibraryPage() {
  const pathname = usePathname() ?? "/"; const locale = pathname === "/fa" || pathname.startsWith("/fa/") ? "fa" : "en"; const fa = locale === "fa";
  const [bookmarks, setBookmarks] = useState<LocalSavedArticle[]>([]);
  const [history, setHistory] = useState<LocalSavedArticle[]>([]);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setBookmarks(readLocalLibrary(BOOKMARKS_KEY));
    setHistory(readLocalLibrary(HISTORY_KEY));
    api.getReaderLibrary().then(({ data }) => {
      setSignedIn(true);
      setBookmarks(data.bookmarks.map(({ article, createdAt }) => ({
        slug: article.slug,
        title: article.title,
        progress: data.history.find((item) => item.article.slug === article.slug)?.percentage ?? 0,
        visitedAt: createdAt,
      })));
      setHistory(data.history.map(({ article, percentage, visitedAt }) => ({ slug: article.slug, title: article.title, progress: percentage, visitedAt })));
    }).catch(() => setSignedIn(false));
  }, []);

  async function logout() {
    await api.logoutReader();
    setSignedIn(false);
    setBookmarks(readLocalLibrary(BOOKMARKS_KEY));
    setHistory(readLocalLibrary(HISTORY_KEY));
  }

  const section = (title: string, items: LocalSavedArticle[]) => (
    <section>
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => <li key={item.slug} className="rounded-lg border border-line p-4"><Link href={localePath(`/blog/${item.slug}`, locale)} className="font-medium hover:text-accent">{item.title}</Link><div className="mt-2 h-1.5 overflow-hidden rounded bg-paper-warm"><div className="h-full bg-accent" style={{ width: `${item.progress}%` }} /></div><p className="mt-1 text-xs text-ink-muted">{fa ? `${item.progress}٪ مطالعه شده` : `${item.progress}% read`}</p></li>)}
        {items.length === 0 && <li className="text-sm text-ink-muted">{fa ? "هنوز چیزی ذخیره نشده است." : "Nothing saved yet."}</li>}
      </ul>
    </section>
  );

  return <div className="mx-auto max-w-4xl px-6 py-16"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-serif text-4xl font-semibold">{fa ? "کتابخانهٔ شما" : "Your library"}</h1><p className="mt-3 text-ink-soft">{signedIn ? (fa ? "با حساب خوانندهٔ شما همگام شده است." : "Synced securely with your reader account.") : (fa ? "به‌صورت خصوصی در این مرورگر ذخیره شده است. برای همگام‌سازی وارد شوید." : "Stored privately in this browser. Sign in to sync across devices.")}</p></div>{signedIn ? <button onClick={logout} className="rounded-md border border-line px-4 py-2 text-sm">{fa ? "خروج" : "Sign out"}</button> : <Link href={localePath("/account", locale)} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white">{fa ? "ورود برای همگام‌سازی" : "Sign in to sync"}</Link>}</div><div className="mt-10 grid gap-12 md:grid-cols-2">{section(fa ? "نشانک‌ها" : "Bookmarks", bookmarks)}{section(fa ? "تاریخچهٔ مطالعه" : "Reading history", history)}</div></div>;
}
