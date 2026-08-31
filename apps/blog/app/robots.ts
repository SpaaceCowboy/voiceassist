import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteMetadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/account",
        "/library",
        "/preview",
        "/fa/admin",
        "/fa/account",
        "/fa/library",
        "/fa/preview",
      ],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
    host: SITE_URL.origin,
  };
}
