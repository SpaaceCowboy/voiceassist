import type { Metadata } from "next";
import { localePath, type Locale } from "@/lib/i18n";

export const SITE_NAME = "Termspace";
export const SITE_DESCRIPTION =
  "An independent editorial journal on software, design, and the ideas shaping technology.";
export const SITE_DESCRIPTION_FA =
  "مجله‌ای مستقل دربارهٔ نرم‌افزار، طراحی و ایده‌هایی که فناوری را شکل می‌دهند.";

function resolveSiteUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!configuredUrl) return new URL("http://localhost:3001");

  try {
    const url = new URL(configuredUrl);
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute URL");
  }
}

export const SITE_URL = resolveSiteUrl();

export function localizedUrl(path: string, locale: Locale): URL {
  return new URL(localePath(path, locale), SITE_URL);
}

export function localizedAlternates(path: string, locale: Locale): Metadata["alternates"] {
  return {
    canonical: localizedUrl(path, locale),
    languages: {
      en: localizedUrl(path, "en"),
      fa: localizedUrl(path, "fa"),
      "x-default": localizedUrl(path, "en"),
    },
  };
}

export function pageMetadata({
  title,
  description,
  path,
  locale,
}: {
  title: string;
  description: string;
  path: string;
  locale: Locale;
}): Metadata {
  return {
    title,
    description,
    alternates: localizedAlternates(path, locale),
    openGraph: {
      title,
      description,
      type: "website",
      url: localizedUrl(path, locale),
      locale: locale === "fa" ? "fa_IR" : "en_US",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
