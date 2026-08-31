import { api } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ?? character);

export async function GET() {
  const articles = (await api.listArticles({ published: true, limit: 50, sort: "newest" })).data;
  const items = articles.map((article) => `<item><title>${escapeXml(article.title)}</title><link>${SITE_URL}/blog/${article.slug}</link><guid>${SITE_URL}/blog/${article.slug}</guid><description>${escapeXml(article.excerpt ?? "")}</description>${article.publishedAt ? `<pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>` : ""}</item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Termspace</title><link>${SITE_URL}</link><description>Notes on craft, code, and calm.</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
