import {getRequestConfig} from "next-intl/server";
import {headers} from "next/headers";

export default getRequestConfig(async () => {
  const locale = (await headers()).get("x-term-locale") === "fa" ? "fa" : "en";
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
