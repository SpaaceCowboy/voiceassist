import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("renders safe links and removes executable link targets", () => {
    expect(renderMarkdown("[Guide](https://example.com/guide)")).toContain('href="https://example.com/guide"');
    expect(renderMarkdown("[Unsafe](javascript:alert(1))")).not.toContain("javascript:");
  });

  it("escapes attribute-breaking characters", () => {
    expect(renderMarkdown('[Link](https://example.com/\" onmouseover=\"alert(1))')).not.toContain('onmouseover="');
  });

  it("does not treat protocol-relative links as internal paths", () => {
    expect(renderMarkdown("[Unsafe](//example.com/path)")).not.toContain("href=");
    expect(renderMarkdown("[Unsafe](/\\example.com/path)")).not.toContain("href=");
    expect(renderMarkdown("[Internal](/blog/article)")).toContain('href="/blog/article"');
  });
});
