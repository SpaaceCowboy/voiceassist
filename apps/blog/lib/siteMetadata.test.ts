import { describe, expect, it } from "vitest";
import { localizedAlternates, localizedUrl } from "./siteMetadata";

describe("site metadata URLs", () => {
  it("adds the Persian prefix only to Persian URLs", () => {
    expect(localizedUrl("/blog/example", "en").pathname).toBe("/blog/example");
    expect(localizedUrl("/blog/example", "fa").pathname).toBe("/fa/blog/example");
  });

  it("uses the current locale for canonical URLs and exposes both languages", () => {
    const alternates = localizedAlternates("/resources/example", "fa");

    expect((alternates?.canonical as URL).pathname).toBe("/fa/resources/example");
    expect((alternates?.languages?.en as URL).pathname).toBe("/resources/example");
    expect((alternates?.languages?.fa as URL).pathname).toBe("/fa/resources/example");
  });
});
