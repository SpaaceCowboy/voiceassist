import { api } from "@/lib/api";
import { AdminArticleList } from "@/components/admin/AdminArticleList";
import { getAdminCookieHeader } from "@/lib/serverApi";

export const revalidate = 0;

export default async function AdminPage() {
  const cookie = await getAdminCookieHeader();
  const [articlesRes, categoriesRes] = await Promise.all([
    api.listArticles({ limit: 10, sort: "newest" }, { cookie }),
    api.listCategories(),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {articlesRes.meta.total} article{articlesRes.meta.total === 1 ? "" : "s"} total
        </p>
      </div>
      <AdminArticleList
        articles={articlesRes.data}
        initialMeta={articlesRes.meta}
        categories={categoriesRes.data}
      />
    </div>
  );
}
