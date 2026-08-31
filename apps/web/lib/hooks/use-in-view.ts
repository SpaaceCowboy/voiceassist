"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  /** Fraction of the element that must be visible before it counts. */
  threshold?: number;
  /** Shrinks the viewport so reveals fire slightly before the true edge. */
  rootMargin?: string;
  /** Stop observing after the first intersection. Default: true. */
  once?: boolean;
};

/**
 * IntersectionObserver wrapper. Returns a ref to attach and whether the
 * element has entered the viewport.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.15,
  rootMargin = "0px 0px -6% 0px",
  once = true,
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No observer (very old browser, or a test environment without the
    // polyfill): show the content rather than leaving it gated forever.
    // Deferred to a frame so it is not a synchronous setState in an effect.
    if (typeof IntersectionObserver === "undefined") {
      const fallback = requestAnimationFrame(() => setIsInView(true));
      return () => cancelAnimationFrame(fallback);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isInView };
}
