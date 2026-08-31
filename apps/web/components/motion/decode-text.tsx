"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%*+=~<>/\\{}[]";

type Props = {
  text: string;
  /** Layout classes for the wrapper (margins, display, width). */
  className?: string;
  /**
   * Classes for the layer that actually paints the characters. Anything that
   * styles the glyphs themselves belongs here, not on `className` — notably
   * `text-plasma`, whose background-clip only works on the element that owns
   * the text nodes.
   */
  textClassName?: string;
  /** Milliseconds before the first character resolves. */
  delay?: number;
  /** Milliseconds between each character locking into place. */
  speed?: number;
};

/**
 * Resolves text out of noise, one character at a time — the brand's terminal
 * heritage stated as motion rather than as a monospace font.
 *
 * Three layers, because getting this right for everyone needs all three:
 *
 *   1. a `visibility: hidden` copy of the real string that holds the box, so
 *      substituted glyphs of a different width can never reflow the headline;
 *   2. an `sr-only` copy that is the actual accessible name, so screen readers
 *      hear the sentence and never the noise;
 *   3. the scrambling layer, painted absolutely over the top and aria-hidden.
 *
 * The scramble starts inside a timeout rather than in the effect body, so the
 * server-rendered markup is the finished sentence and there is no synchronous
 * state write during mount. Under reduced motion it never starts at all and
 * the finished text is what renders.
 */
export function DecodeText({
  text,
  className,
  textClassName,
  delay = 60,
  speed = 32,
}: Props) {
  const prefersReducedMotion = useReducedMotion();
  const [scrambled, setScrambled] = useState<string | null>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    let resolved = 0;
    let elapsed = 0;
    let last = performance.now();

    const step = (now: number) => {
      elapsed += now - last;
      last = now;

      while (elapsed >= speed && resolved < text.length) {
        elapsed -= speed;
        resolved += 1;
      }

      if (resolved >= text.length) {
        setScrambled(null);
        return;
      }

      setScrambled(
        text
          .split("")
          .map((char, index) => {
            if (index < resolved || char === " ") return char;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join(""),
      );

      frameRef.current = requestAnimationFrame(step);
    };

    const startTimer = window.setTimeout(() => {
      last = performance.now();
      frameRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      window.clearTimeout(startTimer);
      cancelAnimationFrame(frameRef.current);
    };
  }, [text, delay, speed, prefersReducedMotion]);

  const isDecoding = scrambled !== null;

  return (
    <span className={cn("relative inline-block", className)}>
      {/* Layout holder. visibility:hidden keeps it out of the a11y tree. */}
      <span className="invisible" aria-hidden>
        {text}
      </span>
      <span className="sr-only">{text}</span>
      <span
        aria-hidden
        data-decoding={isDecoding ? "" : undefined}
        className={cn("absolute inset-0 whitespace-pre-wrap", textClassName)}
      >
        {scrambled ?? text}
      </span>
    </span>
  );
}
