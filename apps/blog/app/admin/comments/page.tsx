import { api } from "@/lib/api";
import { getAdminCookieHeader } from "@/lib/serverApi";
import { CommentManager } from "@/components/admin/CommentManager";

export const revalidate = 0;
export default async function CommentsPage() {
  const comments = await api.listAdminComments({ cookie: await getAdminCookieHeader() });
  return <div><h2 className="mb-6 font-serif text-2xl font-semibold">Comment moderation</h2><CommentManager initialComments={comments.data} /></div>;
}
