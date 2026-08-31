import { api } from "@/lib/api";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { getAdminCookieHeader } from "@/lib/serverApi";

export const revalidate = 0;

export default async function NewArticlePage() {
  const cookie = await getAdminCookieHeader();
  const [authorsRes, categoriesRes, tagsRes, seriesRes, mediaRes] = await Promise.all([
    api.listAuthors(),
    api.listCategories(),
    api.listTags(),
    api.listSeries(),
    api.listMedia({ cookie }),
  ]);

  return (
    <div>
      <h2 className="mb-6 font-serif text-2xl font-semibold tracking-tight">New article</h2>
      <ArticleForm authors={authorsRes.data} categories={categoriesRes.data} tags={tagsRes.data} series={seriesRes.data} media={mediaRes.data} />
    </div>
  );
}
