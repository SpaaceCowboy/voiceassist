import { api } from "@/lib/api";
import { getAdminCookieHeader } from "@/lib/serverApi";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const revalidate = 0;
export default async function AdminResourcesPage() {
  const resources = await api.listResources({ admin: true, cookie: await getAdminCookieHeader() });
  return <div><h2 className="mb-2 font-serif text-2xl font-semibold">Markdown resources</h2><p className="mb-6 text-sm text-ink-soft">Upload, preview, and publish downloadable Markdown files.</p><ResourceManager initialResources={resources.data} /></div>;
}
