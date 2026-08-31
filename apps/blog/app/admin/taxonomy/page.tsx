import { api } from "@/lib/api";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

export const revalidate = 0;
export default async function TaxonomyPage() {
  const [tags, series] = await Promise.all([api.listTags(), api.listSeries()]);
  return <div><h2 className="mb-6 font-serif text-2xl font-semibold">Tags & series</h2><TaxonomyManager initialTags={tags.data} initialSeries={series.data} /></div>;
}
