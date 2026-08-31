import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/estedad";
import "@/styles/globals.css";
import { Providers } from "@/components/layout/providers";
import { getLocale } from "@/lib/serverLocale";
import { localePath } from "@/lib/i18n";
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const fa = locale === "fa";
  return { title: { default: fa ? "ترم‌اسپیس — اجزای هوش مصنوعی" : "termspace — AI building blocks", template: fa ? "%s · ترم‌اسپیس" : "%s · termspace" }, description: fa ? "پرامپت‌ها، مهارت‌ها، عامل‌ها و ابزارهای هوش مصنوعی قابل اعتماد را کشف کنید.": "Discover trusted prompts, skills, agents, MCP servers, and AI tools.", alternates: { canonical: localePath("/", locale), languages: { en: "/", fa: "/fa" } } };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        {/* Scroll reveals are opacity-gated by JS. Without JS there is no
            observer to un-gate them, so hand no-script readers the content. */}
        <noscript>
          <style>{".ts-reveal{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
