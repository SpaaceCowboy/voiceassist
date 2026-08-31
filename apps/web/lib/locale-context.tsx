"use client";
import { createContext, useContext } from "react";
import type { Locale } from "./i18n";
import { copy } from "./i18n";

const LocaleContext = createContext<Locale>("en");
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) { return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>; }
export function useLocale() { const locale = useContext(LocaleContext); return { locale, fa: locale === "fa", t: copy[locale] }; }
