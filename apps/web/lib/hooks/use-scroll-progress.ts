"use client";

import { useEffect, useRef } from "react";

/**
 * Writes an element's scroll progress into a CSS custom property instead of
 * React state. Scrolling is the highest-frequency input on the page; routing
 * it through a re-render would make every frame a reconciliation.
 *
 * `--progress` goes 0 -> 1 as the element travels from just below the
 * viewport to just above it.
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(
  property = "--progress",
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame = 0;
    let queued = false;

    const measure = () => {
      queued = false;
      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const span = rect.height + viewport;
      const travelled = viewport - rect.top;
      const progress = Math.min(1, Math.max(0, travelled / span));
      node.style.setProperty(property, progress.toFixed(4));
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [property]);

  return ref;
}
