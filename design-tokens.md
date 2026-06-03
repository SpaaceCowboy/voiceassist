# VoiceAssist — Design Tokens (source of truth)

Extracted **literally** from the live dashboard code so the landing page reads as the same product.
Read order: `frontend/app/globals.css`, `frontend/tailwind.config.js`, `frontend/components/ui/*`, `frontend/components/nav.tsx`, `frontend/app/layout.tsx`.

> Convention in this repo: colors are stored as **space-separated RGB channels** in CSS variables
> (e.g. `--accent: 124 58 237`) and consumed as `rgb(var(--accent))` or `rgb(var(--accent) / 0.15)`.
> Tailwind exposes them via `withOpacity()` → utilities like `text-accent`, `bg-surface` honor `<alpha-value>`.

---

## 1. Color tokens (exact, in-use)

### Light (`:root`)
| Token | RGB | Hex | Role |
|------|------|-----|------|
| `--bg` | `246 247 249` | `#F6F7F9` | app background (cool off-white) |
| `--surface` | `255 255 255` | `#FFFFFF` | cards |
| `--surface2` | `241 243 246` | `#F1F3F6` | insets, inputs, headers |
| `--border` | `228 231 236` | `#E4E7EC` | hairline borders |
| `--text` | `28 31 38` | `#1C1F26` | near-black body text |
| `--muted` | `107 114 128` | `#6B7280` | secondary text |
| `--accent` | `124 58 237` | `#7C3AED` | **brand signal — violet-600** |
| `--accent2` | `139 92 246` | `#8B5CF6` | lighter violet (hover/accent) |

### Dark (`html.dark`)
| Token | RGB | Hex | Role |
|------|------|-----|------|
| `--bg` | `18 20 25` | `#121419` | app background (soft graphite, not black) |
| `--surface` | `28 31 38` | `#1C1F26` | cards — **already lighter than bg** ✓ |
| `--surface2` | `35 38 46` | `#23262E` | insets |
| `--border` | `46 50 60` | `#2E323C` | borders |
| `--text` | `230 232 238` | `#E6E8EE` | soft white |
| `--muted` | `152 159 171` | `#989FAB` | secondary text |
| `--accent` | `167 139 250` | `#A78BFA` | **brand signal — violet-400 (lighter on dark)** |
| `--accent2` | `196 181 253` | `#C4B5FD` | violet-300 |

**Single accent rule:** the only brand/signal color anywhere is violet (`--accent`). The chart palette
(`SERIES_COLORS`: sky `56 189 248`, emerald `16 185 129`, amber `251 191 36`, rose `244 63 94`, teal `20 184 166`)
exists for **data categories only** — the landing page must NOT turn into a rainbow. Use violet as the one signal;
category tints only if a section genuinely needs to distinguish items, kept very muted.

---

## 2. Elevation (existing)
```
--shadow-sm: 0 1px 2px rgba(16,18,27,0.06)        (light)  /  0 1px 2px rgba(0,0,0,0.30)   (dark)
--shadow-md: 0 6px 20px rgba(16,18,27,0.08)       (light)  /  0 10px 30px rgba(0,0,0,0.40)  (dark)
```
Dashboard cards = `rounded-2xl border shadow-sm`, hover `-translate-y-0.5 shadow-md`. The landing **clay**
recipe is a richer cousin of this same idea (see §6), not a foreign style.

## 3. Radius scale (existing)
```
--radius: 16px        tailwind: rounded-xl 14px · rounded-2xl 18px
(added last pass: rounded-clay 34px — being RETUNED to 28px per brief, see §6)
```

## 4. Typography
- `--font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, …`
- `--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, …`
- Tailwind: `font-sans` / `font-mono` → these vars.
- **GAP FOUND:** Inter & JetBrains Mono are *named but never loaded* — no `next/font`, no `@import`, no
  `<link>`, no `@font-face` exists in the repo. The app silently falls back to the system stack (Segoe UI on
  Windows). **Fix (improves both surfaces, coherent):** load `Inter` + `JetBrains Mono` via `next/font` in
  `app/layout.tsx` and point `--font-sans` / `--font-mono` at the generated font variables. This makes the
  existing token intent real instead of changing it.
- Weights to load: Inter 400/500/600/700; JetBrains Mono 400/500.

## 5. Spacing / motion rhythm (existing, to echo)
- Content max width: `max-w-[1400px]` (dashboard). Landing marketing width: `max-w-[1180px]` centered.
- Card padding: `p-4`–`p-7`. Section gaps: `gap-4`/`gap-6`. Page padding: `px-6 … lg:px-10`.
- Existing motion: `animate-fade-in` (`fade-in 0.25s ease`), `active:scale-[0.98]` on buttons,
  `transition hover:-translate-y-0.5` on cards. Easing language = quiet & quick. The landing GSAP work
  extends this, it doesn't fight it.
- `prefers-reduced-motion: reduce` is **already globally respected** in `globals.css` (animations/transitions
  forced to ~0). Landing GSAP must additionally guard with `gsap.matchMedia`.

## 6. Claymorphism extension tokens (NEW — derived from the above, tuned not maximal)

> Re-derived for THIS cool/violet palette (the brief's warm `#F3F1EC` example is explicitly "prefer dashboard's
> surface color"). Dark mode is **re-derived, never inverted.** Implemented as CSS variables that flip on `.dark`,
> exposed through one Tailwind utility each so the same class adapts across modes.

### Light
```css
--clay-bg:       237 239 243;   /* #EDEFF3 — page bg, a touch deeper than --bg so cards lift */
--clay-surface:  252 253 254;   /* #FCFDFE — matte near-white (NOT pure #FFF), faintly cool */
--clay-border:   rgba(16,18,27,0.05);            /* hairline rim */
--clay-shadow:
  0 14px 30px -10px rgba(31,41,55,0.12),         /* outer lift — soft, large blur */
  inset 0 2px 3px rgba(255,255,255,0.90),        /* top highlight — inflated top edge */
  inset 0 -8px 14px -4px rgba(31,41,55,0.06);    /* underside — the puffy curve */
--clay-shadow-hover:
  0 22px 44px -12px rgba(31,41,55,0.16),
  inset 0 2px 3px rgba(255,255,255,0.90),
  inset 0 -8px 14px -4px rgba(31,41,55,0.06);
--clay-shadow-pressed:                            /* flatter: kill lift, deepen inner bottom */
  0 2px 6px -2px rgba(31,41,55,0.10),
  inset 0 1px 2px rgba(255,255,255,0.60),
  inset 0 -2px 6px rgba(31,41,55,0.12);
```

### Dark (re-derived)
```css
--clay-bg:       15 17 22;      /* #0F1116 — page bg, clearly below the surface */
--clay-surface:  28 31 38;      /* #1C1F26 — dashboard --surface, LIGHTER than bg ✓ */
--clay-border:   rgba(255,255,255,0.06);          /* soft rim that catches "light" */
--clay-shadow:
  0 18px 38px -12px rgba(0,0,0,0.60),             /* outer depth on dark */
  inset 0 1px 1px rgba(255,255,255,0.05),         /* FAINT top highlight (not a bright line) */
  inset 0 -8px 16px -4px rgba(0,0,0,0.45);        /* underside — STRONGER than light mode */
--clay-shadow-hover:
  0 26px 52px -14px rgba(0,0,0,0.66),
  inset 0 1px 1px rgba(255,255,255,0.05),
  inset 0 -8px 16px -4px rgba(0,0,0,0.45);
--clay-shadow-pressed:
  0 2px 8px -3px rgba(0,0,0,0.50),
  inset 0 1px 1px rgba(255,255,255,0.04),
  inset 0 -3px 8px rgba(0,0,0,0.50);
```

### Radii & Tailwind exposure
```
--clay-radius:    28px   (cards/panels)      → rounded-clay
--clay-radius-sm: 18px   (pills, buttons, chips)
--clay-radius-lg: 36px   (hero dashboard frame)
boxShadow:  clay / clay-hover / clay-pressed  → var(--clay-shadow…)
```
Usage: `class="bg-[rgb(var(--clay-surface))] shadow-clay rounded-clay border border-[var(--clay-border)]"` —
adapts light↔dark with zero per-mode markup. Press state swaps to `shadow-clay-pressed` (≈120ms).

### Why this is clay, not neumorphism
- Surface color is **distinct** from the background in both modes (#FCFDFE on #EDEFF3 / #1C1F26 on #0F1116) — visible lift, not pressed-in.
- There IS an **outer** drop shadow (neumorphism has none) + two inner shadows for the inflated curve.
- Matte solid fill, generous 28px radius, optional rim. No blur/transparency (not glass).

---

## 7. Reusable assets already in the repo (use, don't reinvent)
- Icons: `components/ui/icons.tsx` — `PhoneIcon, CalendarIcon, HeartPulseIcon, HelpIcon, ChartIcon, ShieldIcon,
  SparkIcon, CheckCircleIcon, ClockIcon, ActivityIcon, BoltIcon, SunIcon, MoonIcon, …` (stroke = currentColor).
- Theme: `.dark` on `<html>`, persisted to `localStorage["theme"]`, FOUC-guarded by inline script in `layout.tsx`.
- Logo lockup pattern: gradient "N" tile + "NeuroSpine / Voice Assistant" (`nav.tsx`). Landing wordmark = **VoiceAssist** per brief.
- Shell: `AppShell.tsx` renders `/`, `/login`, `/signup` full-bleed (no sidebar) — landing already wired in.
