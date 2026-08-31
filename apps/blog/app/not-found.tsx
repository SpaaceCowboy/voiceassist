"use client";

import Link from "next/link";
import {useLocale, useTranslations} from "next-intl";
import {localePath, type Locale} from "@/lib/i18n";

export default function NotFound() {
  const locale = useLocale() as Locale;
  const t = useTranslations("NotFound");
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-ink-muted">404</p>
      <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mx-auto mt-4 max-w-prose text-ink-soft">{t("description")}</p>
      <Link href={localePath("/", locale)} className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 font-medium text-paper hover:bg-accent-soft">
        {t("home")}
      </Link>
    </div>
  );
}
