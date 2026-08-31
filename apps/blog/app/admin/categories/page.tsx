import { api } from "@/lib/api";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const categoriesRes = await api.listCategories();

  return (
    <div>
      <h2 className="mb-6 font-serif text-2xl font-semibold tracking-tight">Categories</h2>
      <CategoryManager categories={categoriesRes.data} />
    </div>
  );
}