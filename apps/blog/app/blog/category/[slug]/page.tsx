import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";
import { EmptyState } from "@/components/EmptyState";
import {getTranslations} from "next-intl/server";
import {getLocale} from "@/lib/serverLocale";
import {categoryNamesFa} from "@/lib/faContent";
import {localizedAlternates, localizedUrl} from "@/lib/siteMetadata";

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const categoriesRes = await api.listCategories();
  const category = categoriesRes.data.find((c) => c.slug === slug);

  if (!category) {
    return {
      title: "Topic not found",
      robots: { index: false, follow: false },
    };
  }

  const categoryName = locale === "fa" ? categoryNamesFa[category.slug] ?? category.name : category.name;
  const path = `/blog/category/${category.slug}`;
  const url = localizedUrl(path, locale);
  const description = category.description ?? (locale === "fa"
    ? `مقالات موضوع ${categoryName} را در ترم‌اسپیس بخوانید.`
    : `Read ${categoryName} articles from Termspace.`);

  return {
    title: categoryName,
    description,
    alternates: localizedAlternates(path, locale),
    openGraph: {
      title: locale === "fa" ? `مقالات ${categoryName}` : `${categoryName} articles`,
      description,
      type: "website",
      url,
      locale: locale === "fa" ? "fa_IR" : "en_US",
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Common")]);
  const { slug } = await params;
  const categoriesRes = await api.listCategories();
  const category = categoriesRes.data.find((c) => c.slug === slug);

  if (!category) notFound();

  const articlesRes = await api.listArticles({
    limit: 50,
    category: category.slug,
    published: true,
  });
  const categoryName = locale === "fa" ? categoryNamesFa[category.slug] ?? category.name : category.name;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-widest text-ink-muted">{t("topic")}</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight">{categoryName}</h1>
        {category.description && (
          <p className="mt-4 text-ink-soft max-w-prose">{category.description}</p>
        )}
        <p className="mt-4 text-sm text-ink-muted">
          {articlesRes.meta.total} {t("articles")}
        </p>
      </header>

      {articlesRes.data.length === 0 ? (
        <EmptyState
          title={t("noArticles")}
          description={t("checkBack")}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articlesRes.data.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
