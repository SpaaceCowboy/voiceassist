export type Locale = "en" | "fa";

export function localePath(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return locale === "fa" ? `/fa${normalized === "/" ? "" : normalized}` : normalized;
}

export const copy = {
  en: {
    home: "Home", blog: "Blog", editions: "Editions", topics: "Topics", resources: "Resources", library: "Library", signIn: "Sign in",
    explore: "Explore", allArticles: "All articles", markdownResources: "Markdown resources", footer: "An independent editorial journal on software, design, and the ideas shaping technology.", crafted: "Crafted with care.",
    journal: "The journal", articlesTitle: "All articles", articlesIntro: "Essays and field notes on the craft of building software and the ideas that shape it.",
    archive: "The archive", editionsTitle: "Editorial editions", editionsIntro: "Numbered collections of essays assembled around one question, designed to be read together and revisited over time.", enterEdition: "Enter the edition", pieces: "pieces",
    currentEdition: "The current edition", openEdition: "Open edition", beginWith: "Begin with", consideredPieces: "considered pieces · Read in sequence or wander", fromEditor: "From the editor", browseEditions: "Browse the edition archive",
    resourceLibrary: "Resource library", resourcesTitle: "Useful Markdown files", resourcesIntro: "Review practical files in the browser, then download clean Markdown copies to adapt for your own work.", review: "Review", download: "Download .md", noResources: "No resources have been published yet.",
  },
  fa: {
    home: "خانه", blog: "مقالات", editions: "شماره‌ها", topics: "موضوعات", resources: "منابع", library: "کتابخانه", signIn: "ورود",
    explore: "کاوش", allArticles: "همهٔ مقالات", markdownResources: "منابع مارک‌داون", footer: "مجله‌ای مستقل دربارهٔ نرم‌افزار، طراحی و ایده‌هایی که فناوری را شکل می‌دهند.", crafted: "با دقت ساخته شده است.",
    journal: "مجله", articlesTitle: "همهٔ مقالات", articlesIntro: "جستارها و یادداشت‌هایی دربارهٔ ساخت نرم‌افزار و ایده‌هایی که دنیای فناوری را شکل می‌دهند.",
    archive: "آرشیو", editionsTitle: "شماره‌های تحریریه", editionsIntro: "مجموعه‌هایی شماره‌دار از جستارها که پیرامون یک پرسش گردآوری شده‌اند؛ برای خواندن در کنار هم و بازگشت دوباره.", enterEdition: "ورود به این شماره", pieces: "مطلب",
    currentEdition: "شمارهٔ تازه", openEdition: "مشاهدهٔ شماره", beginWith: "شروع با", consideredPieces: "مطلب منتخب · به‌ترتیب بخوانید یا آزادانه کاوش کنید", fromEditor: "یادداشت سردبیر", browseEditions: "مشاهدهٔ آرشیو شماره‌ها",
    resourceLibrary: "کتابخانهٔ منابع", resourcesTitle: "فایل‌های کاربردی مارک‌داون", resourcesIntro: "فایل‌های کاربردی را در مرورگر بررسی کنید و نسخهٔ مارک‌داون آن‌ها را برای استفادهٔ خود دریافت کنید.", review: "بررسی", download: "دریافت فایل", noResources: "هنوز منبعی منتشر نشده است.",
  },
} as const;
