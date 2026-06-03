"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/* ---- prefers-reduced-motion (SSR-safe, reactive) ------------------- */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

/* ---- dark mode (mirrors the <html> class the app already manages) -- */
export function useIsDark(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const obs = new MutationObserver(cb);
      obs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => obs.disconnect();
    },
    () => document.documentElement.classList.contains("dark"),
    () => false
  );
}

/* ---- window scrolled past a threshold (for the nav) ---------------- */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/* ---- count-up to a target when `active` flips true ----------------- */
export function useCountUp(
  target: number,
  active: boolean,
  { duration = 1400, decimals = 0 }: { duration?: number; decimals?: number } = {}
): number {
  const reduce = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || reduce || started.current) return;
    started.current = true;

    let raf = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      const n = target * eased;
      setValue(decimals ? Number(n.toFixed(decimals)) : Math.round(n));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration, decimals, reduce]);

  // Reduced-motion users get the final value with no animation.
  return reduce ? target : value;
}

/* ---- typewriter that types a list of lines, then loops ------------- */
export function useTypewriter(
  lines: string[],
  { active, charMs = 26, holdMs = 2600, lineGapMs = 360 }: {
    active: boolean;
    charMs?: number;
    holdMs?: number;
    lineGapMs?: number;
  }
): { visible: string[]; activeLine: number } {
  const reduce = usePrefersReducedMotion();
  const [visible, setVisible] = useState<string[]>(() => lines.map(() => ""));
  const [activeLine, setActiveLine] = useState(0);

  useEffect(() => {
    if (!active) return;

    if (reduce) {
      setVisible(lines);
      setActiveLine(lines.length - 1);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>((r) => timers.push(setTimeout(r, ms)));

    const run = async () => {
      while (!cancelled) {
        setVisible(lines.map(() => ""));
        for (let i = 0; i < lines.length && !cancelled; i++) {
          setActiveLine(i);
          const full = lines[i];
          for (let c = 1; c <= full.length && !cancelled; c++) {
            setVisible((prev) => {
              const next = [...prev];
              next[i] = full.slice(0, c);
              return next;
            });
            await wait(charMs);
          }
          await wait(lineGapMs);
        }
        await wait(holdMs);
      }
    };
    run();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduce]);

  return { visible, activeLine };
}
