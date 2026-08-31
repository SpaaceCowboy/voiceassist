import { describe, expect, it } from "vitest";
import { ARTICLE_FALLBACK_IMAGE, safeImageSrc } from "./images";

describe("safeImageSrc", () => {
  it("accepts configured HTTPS image hosts", () => {
    const src = "https://images.unsplash.com/photo-123";
    expect(safeImageSrc(src, ARTICLE_FALLBACK_IMAGE)).toBe(src);
  });

  it("falls back for HTTP, malformed, and unapproved hosts", () => {
    expect(safeImageSrc("http://images.unsplash.com/photo-123", ARTICLE_FALLBACK_IMAGE)).toBe(ARTICLE_FALLBACK_IMAGE);
    expect(safeImageSrc("not-a-url", ARTICLE_FALLBACK_IMAGE)).toBe(ARTICLE_FALLBACK_IMAGE);
    expect(safeImageSrc("https://example.com/image.jpg", ARTICLE_FALLBACK_IMAGE)).toBe(ARTICLE_FALLBACK_IMAGE);
  });

  it("rejects protocol-relative paths disguised as local images", () => {
    expect(safeImageSrc("//example.com/image.jpg", ARTICLE_FALLBACK_IMAGE)).toBe(ARTICLE_FALLBACK_IMAGE);
    expect(safeImageSrc("/\\example.com/image.jpg", ARTICLE_FALLBACK_IMAGE)).toBe(ARTICLE_FALLBACK_IMAGE);
    expect(safeImageSrc("/images/local.jpg", ARTICLE_FALLBACK_IMAGE)).toBe("/images/local.jpg");
  });
});
