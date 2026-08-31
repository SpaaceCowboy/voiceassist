import { api } from "@/lib/api";
import { BlogExplorer } from "@/components/BlogExplorer";
import { getLocale } from "@/lib/serverLocale";
import { copy } from "@/lib/i18n";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/siteMetadata";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    title: locale === "fa" ? "همهٔ مقالات" : "All articles",
    description: copy[locale].articlesIntro,
    path: "/blog",
    locale,
  });
}

interface BlogPageProps {
  searchParams?: Promise<{
    category?: string;
    q?: string;
    page?: string;
    sort?: string;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const locale = await getLocale();
  const t = copy[locale];
  const query = await searchParams;
  const page = Math.max(1, Number(query?.page) || 1);
  const category = query?.category ?? "";
  const search = query?.q ?? "";
  const sort =
    query?.sort === "oldest" || query?.sort === "title"
      ? query.sort
      : "newest";

  const [articlesRes, categoriesRes, popularRes] = await Promise.all([
    api.listArticles({
      page,
      limit: 9,
      category: category || undefined,
      search: search || undefined,
      published: true,
      sort,
    }),
    api.listCategories(),
    api.listPopularSearches(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-widest text-ink-muted">{t.journal}</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight">{t.articlesTitle}</h1>
        <p className="mt-4 text-ink-soft max-w-prose">
          {t.articlesIntro}
        </p>
      </header>

      <BlogExplorer
        initialArticles={articlesRes.data}
        initialMeta={articlesRes.meta}
        categories={categoriesRes.data}
        initialCategory={category}
        initialSearch={search}
        initialPage={page}
        initialSort={sort}
        popularSearches={popularRes.data}
        locale={locale}
      />
    </div>
  );
}
