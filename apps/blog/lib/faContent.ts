import type { ArticleDetail, ArticleSummary, Edition } from "./types";

const articles: Record<string, { title: string; excerpt: string }> = {
  "designing-calm-interfaces": { title: "طراحی رابط‌های آرام برای جهانی پرهیاهو", excerpt: "بهترین رابط‌ها توجه را طلب نمی‌کنند؛ آن را به دست می‌آورند. راهنمایی برای خویشتن‌داری، فضای خالی و سلسله‌مراتب آرام." },
  "practical-guide-to-rag": { title: "راهنمای کاربردی تولید تقویت‌شده با بازیابی", excerpt: "RAG فراتر از یک واژهٔ مُد روز است؛ چگونه سامانه‌ای دقیق و سودمند بسازیم، بدون آن‌که بیش‌ازحد پیچیده‌اش کنیم." },
  "writing-more-by-hand": { title: "در ستایش بیشتر نوشتن با دست", excerpt: "یک رسانهٔ آهسته‌تر می‌تواند به اندیشه‌ای روشن‌تر بینجامد؛ چرا دفتر ساده هنوز جایگاه خود را حفظ کرده است." },
  "what-senior-engineers-do": { title: "مهندسان ارشد واقعاً چه می‌کنند؟", excerpt: "ارشدبودن به معنای نوشتن کد بیشتر نیست؛ یعنی کاری کنیم که به کد کمتری نیاز باشد." },
  "boring-side-projects": { title: "چرا پروژهٔ جانبی شما باید کسل‌کننده باشد", excerpt: "ماندگارترین پروژه‌ها معمولاً پرزرق‌وبرق‌ترین نیستند؛ دفاعی از انتخاب مسیر ساده و بی‌ادعا." },
  "typography-is-the-interface": { title: "تایپوگرافی همان رابط کاربری است", excerpt: "پیش از دکمه‌ها و رنگ‌ها، متن قرار دارد؛ چرا حروف بنیان هر صفحه‌اند." },
};

export const categoryNamesFa: Record<string, string> = {
  "artificial-intelligence": "هوش مصنوعی", "software-engineering": "مهندسی نرم‌افزار", productivity: "بهره‌وری", design: "طراحی", technology: "فناوری",
};

export function localizeArticleFa<T extends ArticleSummary | ArticleDetail>(article: T): T {
  const translation = articles[article.slug];
  return { ...article, ...(translation ?? {}), category: { ...article.category, name: categoryNamesFa[article.category.slug] ?? article.category.name } };
}

export function localizeEditionFa(edition: Edition): Edition {
  if (edition.slug !== "software-and-the-human-scale") return edition;
  return {
    ...edition,
    title: "نرم‌افزار در مقیاس انسانی",
    description: "شش جستار دربارهٔ ساخت فناوری با خویشتن‌داری، وضوح و احترام به توجه انسان.",
    editorialNote: "فناوری اغلب با توانایی‌هایش سنجیده می‌شود. این شماره پرسشی آرام‌تر مطرح می‌کند: آیا نرم‌افزاری که می‌سازیم، اختیار، توجه و درک بیشتری برای انسان باقی می‌گذارد؟",
    articles: edition.articles.map(localizeArticleFa),
  };
}
