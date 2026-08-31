import { describe, expect, it } from "vitest";
import { copy, localePath } from "./i18n";
import { localizeEditionFa } from "./faContent";

describe("localization", () => {
  it("prefixes Persian routes without changing English routes", () => {
    expect(localePath("/blog", "fa")).toBe("/fa/blog");
    expect(localePath("/", "fa")).toBe("/fa");
    expect(localePath("/blog", "en")).toBe("/blog");
  });

  it("contains Persian interface copy and current-edition metadata", () => {
    expect(copy.fa.editionsTitle).toBe("شماره‌های تحریریه");
    const edition = localizeEditionFa({ slug: "software-and-the-human-scale", articles: [], title: "English", description: "English", editorialNote: "English" } as never);
    expect(edition.title).toBe("نرم‌افزار در مقیاس انسانی");
  });
});
