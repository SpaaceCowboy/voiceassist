import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ArticleEngagement } from "./ArticleEngagement";

describe("ArticleEngagement", () => {
  beforeEach(() => window.localStorage.clear());

  it("stores and removes browser-local bookmarks", async () => {
    const user = userEvent.setup();
    render(<ArticleEngagement slug="test-article" title="Test article" />);
    const button = screen.getByRole("button", { name: "Bookmark" });
    await user.click(button);
    expect(window.localStorage.getItem("termAcademy.bookmarks")).toContain("test-article");
    await user.click(screen.getByRole("button", { name: "Bookmarked" }));
    expect(window.localStorage.getItem("termAcademy.bookmarks")).toBe("[]");
  });
});
