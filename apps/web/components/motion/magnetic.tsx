"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { pointer, subscribePointer } from "@/lib/pointer";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** How far the element is allowed to travel toward the cursor, in px. */
  strength?: number;
  /** Distance at which the pull starts, in px. */
  radius?: number;
};

/**
 * Pulls its child toward the cursor as the cursor approaches. The effect is
 * the interactive equivalent of eye contact: the button acknowledges you
 * before you have committed to clicking it.
 *
 * Written straight to `transform` on each shared-pointer frame — no state, no
 * re-render. Disabled outright on coarse pointers and under reduced motion.
 */
export function Magnetic({
  children,
  className,
  strength = 14,
  radius = 130,
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let currentX = 0;
    let currentY = 0;

    const unsubscribe = subscribePointer(() => {
      const rect = node.getBoundingClientRect();
      if (rect.width === 0) return;

      const cursorX = pointer.clientX * window.innerWidth;
      const cursorY = pointer.clientY * window.innerHeight;
      const dx = cursorX - (rect.left + rect.width / 2);
      const dy = cursorY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);

      // Falls off linearly to zero at the radius edge.
      const pull = distance > radius ? 0 : 1 - distance / radius;
      const nextX = (dx / radius) * strength * pull;
      const nextY = (dy / radius) * strength * pull;

      // Skip the write when nothing meaningfully moved.
      if (Math.abs(nextX - currentX) < 0.05 && Math.abs(nextY - currentY) < 0.05) {
        return;
      }

      currentX = nextX;
      currentY = nextY;
      node.style.transform = `translate3d(${nextX.toFixed(2)}px, ${nextY.toFixed(2)}px, 0)`;
    });

    return () => {
      unsubscribe();
      node.style.transform = "";
    };
  }, [prefersReducedMotion, strength, radius]);

  return (
    <span ref={ref} className={cn("inline-flex will-change-transform", className)}>
      {children}
    </span>
  );
}
