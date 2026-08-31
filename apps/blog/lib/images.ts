export const ARTICLE_FALLBACK_IMAGE = "/images/article-fallback.svg";
export const AVATAR_FALLBACK_IMAGE = "/images/avatar-fallback.svg";

const allowedHosts = new Set(
  (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "images.unsplash.com")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);

export function safeImageSrc(src: string | null | undefined, fallback: string): string {
  if (!src) return fallback;
  if (src.startsWith("/") && !src.startsWith("//") && !src.startsWith("/\\")) return src;

  try {
    const url = new URL(src);
    const localDevelopment = process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    return localDevelopment || (url.protocol === "https:" && allowedHosts.has(url.hostname.toLowerCase())) ? src : fallback;
  } catch {
    return fallback;
  }
}
