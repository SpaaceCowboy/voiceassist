"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Maximum rotation on each axis, in degrees. */
  max?: number;
  /** Adds a cursor-tracking highlight over the surface. */
  spotlight?: boolean;
};

/**
 * Real 3D tilt: the card rotates about its own X and Y axes under a
 * perspective, and a soft highlight tracks the cursor across the surface so
 * the tilt reads as a lit plane rather than a skew.
 *
 * Uses local pointer events rather than the shared store — a card only needs
 * to compute anything while the cursor is actually inside it.
 */
export function TiltCard({ children, className, max = 7, spotlight = true }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let frame = 0;

    const apply = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty("--tilt-x", `${((0.5 - py) * max * 2).toFixed(2)}deg`);
        node.style.setProperty("--tilt-y", `${((px - 0.5) * max * 2).toFixed(2)}deg`);
        node.style.setProperty("--spot-x", `${(px * 100).toFixed(1)}%`);
        node.style.setProperty("--spot-y", `${(py * 100).toFixed(1)}%`);
      });
    };

    const reset = () => {
      cancelAnimationFrame(frame);
      node.style.setProperty("--tilt-x", "0deg");
      node.style.setProperty("--tilt-y", "0deg");
    };

    node.addEventListener("pointermove", apply);
    node.addEventListener("pointerleave", reset);

    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", apply);
      node.removeEventListener("pointerleave", reset);
    };
  }, [prefersReducedMotion, max]);

  return (
    <div
      ref={ref}
      data-spotlight={spotlight ? "" : undefined}
      className={cn("ts-tilt", className)}
    >
      {children}
    </div>
  );
}
