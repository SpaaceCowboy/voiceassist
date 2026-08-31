import { api } from "@/lib/api";
import { getAdminCookieHeader } from "@/lib/serverApi";
import { MediaManager } from "@/components/admin/MediaManager";

export const revalidate = 0;
export default async function MediaPage() {
  const assets = await api.listMedia({ cookie: await getAdminCookieHeader() });
  return <div><h2 className="mb-6 font-serif text-2xl font-semibold">Media library</h2><MediaManager initialAssets={assets.data} /></div>;
}
