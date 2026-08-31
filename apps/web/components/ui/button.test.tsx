import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
describe("Button", () => {
  it("renders an accessible disabled action", () => {
    render(<Button disabled>Purchase</Button>);
    expect(screen.getByRole("button", { name: "Purchase" })).toBeDisabled();
  });
});
