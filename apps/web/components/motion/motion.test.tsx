import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DecodeText } from "./decode-text";
import { CountUp } from "./count-up";
import { Reveal } from "./reveal";
import { Marquee } from "./marquee";

/**
 * These assertions are about the guarantees, not the animations: that a
 * reduced-motion visitor and a screen reader get the real content, and that
 * decoration never becomes the only copy of something.
 */

describe("DecodeText", () => {
  it("exposes the sentence to assistive tech exactly once", () => {
    const { container } = render(<DecodeText text="Start from what works." />);

    // The string is in the DOM three times on purpose: a visibility-hidden
    // layout holder that stops substituted glyphs reflowing the headline, the
    // sr-only accessible copy, and the layer that paints characters. Only one
    // of the three may reach a screen reader, or the sentence gets announced
    // repeatedly.
    const copies = [...container.querySelectorAll("span")].filter(
      (node) => node.textContent === "Start from what works.",
    );
    expect(copies).toHaveLength(3);

    const exposed = copies.filter(
      (node) => node.getAttribute("aria-hidden") !== "true",
    );
    expect(exposed).toHaveLength(1);
    expect(exposed[0]).toHaveClass("sr-only");
  });

  it("renders the finished text under reduced motion", () => {
    const { container } = render(<DecodeText text="Ship it" />);
    expect(container.textContent).toContain("Ship it");
    expect(container.querySelector("[data-decoding]")).toBeNull();
  });
});

describe("CountUp", () => {
  it("shows the final value immediately under reduced motion", () => {
    render(<CountUp value={2847} />);
    expect(screen.getByText("2,847")).toBeInTheDocument();
  });

  it("keeps prefix and suffix attached to the value", () => {
    render(<CountUp value={100} suffix="%" prefix="~" />);
    expect(screen.getByText(/~100%/)).toBeInTheDocument();
  });
});

describe("Reveal", () => {
  it("marks content revealed once it intersects, so it is never left hidden", () => {
    const { container } = render(
      <Reveal>
        <p>Featured building blocks</p>
      </Reveal>,
    );
    expect(screen.getByText("Featured building blocks")).toBeInTheDocument();
    expect(container.querySelector("[data-revealed]")).not.toBeNull();
  });
});

describe("Marquee", () => {
  it("duplicates the track for a seamless loop but hides the copy from AT", () => {
    render(
      <Marquee>
        <span>Claude</span>
      </Marquee>,
    );
    // Two copies in the DOM so the loop point is seamless, but the duplicate
    // track is aria-hidden so the list is only announced once.
    const copies = screen.getAllByText("Claude");
    expect(copies).toHaveLength(2);
    expect(copies.filter((node) => node.closest("[aria-hidden]"))).toHaveLength(
      1,
    );
  });
});
