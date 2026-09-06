import { notFound } from "next/navigation";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import { getAdminCookieHeader } from "@/lib/serverApi";

export const metadata = { title: "Article preview", robots: { index: false, follow: false } };
export const revalidate = 0;

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let article;
  try {
    article = (await api.getArticlePreview(token, { cookie: await getAdminCookieHeader() })).data;
  } catch (error) {
    if (!(error instanceof ApiClientError) || error.status !== 404) throw error;
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        Private preview · This article may be unpublished. <Link href="/admin" className="underline">Return to admin</Link>
      </div>
      <h1 className="font-serif text-5xl font-semibold tracking-tight">{article.title}</h1>
      {article.excerpt && <p className="mt-5 text-lg text-ink-soft">{article.excerpt}</p>}
      <div className="prose-article py-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }} />
    </article>
  );
}
