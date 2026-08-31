import { headers } from "next/headers";
import type { Locale } from "./i18n";
export async function getLocale(): Promise<Locale> { return (await headers()).get("x-term-locale") === "fa" ? "fa" : "en"; }
