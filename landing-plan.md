# VoiceAssist — Landing Page Plan (Claymorphism · light + dark)

Source of truth for tokens: **`design-tokens.md`**. One product job: in <8s convince a clinic ops lead
*"we will never miss another patient call."* Voice: quiet, clinical-grade, specific numbers. One accent (violet).

## Claymorphism, confirmed (vs the two it is NOT)
- **Clay** = matte solid surface, big radius (28px), **outer** drop shadow (lift) + **two inner** shadows
  (bright top highlight, dark underside) = inflated/puffy. Warm, tactile, premium — *tuned*, not candy.
- **NOT Neumorphism** = no same-color "pressed into bg," no monochrome-only low-contrast. Our surface is a
  *different* value from bg and has a real outer shadow → it lifts.
- **NOT Glassmorphism** = no transparency/`backdrop-blur` as the surface treatment.

---

## Build passes (order)
1. **Tokens** → rewrite the clay kit in `globals.css` to the tuned recipe in `design-tokens.md §6`; update `tailwind.config.js` (clay shadows/radii). Load Inter + JetBrains Mono via `next/font` in `layout.tsx`, wire `--font-sans/--font-mono`.
2. **Structure** → all 11 sections with real copy + seed data, semantic + responsive, no motion yet.
3. **Clay styling** → apply surfaces/borders/rims; verify lift by eye in both modes.
4. **Motion** → GSAP timeline + ScrollTrigger + interactions, all inside `gsap.matchMedia`.
5. **Dark-mode pass** → the dedicated checklist (surface > bg, faint top highlight, strong underside, rim, AA contrast).
6. **QA** → run acceptance checklist, `tsc`, `eslint`, `next build`; fix everything.

## Files
```
app/page.tsx                       metadata + <Landing/>
app/layout.tsx                     + next/font (Inter, JetBrains Mono) → CSS vars
app/globals.css                    retuned clay variables (light/dark/hover/pressed) + rim
tailwind.config.js                 boxShadow clay/clay-hover/clay-pressed, rounded-clay scale
components/landing/
  Landing.tsx                      page shell + GSAP orchestration (scope root, matchMedia)
  data.ts                          seed data (patients, providers, metrics, transcript, logos, pricing, copy)
  primitives.tsx                   ClayCard, ClayPill, MagneticButton, SectionHeading, AccentDot
  hooks.ts                         useCountUp, useTypewriter, useIsDark (useSyncExternalStore)
  Nav.tsx                          sticky, transparent→solid-clay on scroll, theme toggle, mobile overlay
  Hero.tsx                         2-col; copy left, DashboardFrame right
  DashboardFrame.tsx               clay frame: LiveCalls + waveform, LiveTranscript typer, TodayMetrics, RecentCallers
  Problem.tsx  HowItWorks.tsx  MetricsBand.tsx  FeatureDeepDive.tsx
  Security.tsx  SocialProof.tsx  Pricing.tsx  FinalCTA.tsx  Footer.tsx
```
(Some small sections may be co-located in `Landing.tsx` if that reads cleaner — coherence over fragmentation.)

---

## Sections — wireframe · tokens · motion

### 1. Nav (sticky, ~64px)
- Transparent over hero; on scroll>8px → solid clay bar (`shadow-clay`, `bg-clay-surface/90`, blur fallback off).
- Left **VoiceAssist** wordmark (gradient violet tile). Center: Product · How it works · Dashboard · Security · Pricing. Right: "Sign in" (ghost) + **Book demo** clay pill (accent fill) + theme toggle.
- Mobile <768px: center links → hamburger → full clay overlay.
- Motion: bar bg/shadow cross-fade on scroll (ScrollTrigger toggle, 200ms). No entrance.

### 2. Hero (2-col desktop, stacks <768px)
- **Left:** eyebrow clay pill (accent dot + "Now in pilot with 40+ clinics") · H1 **"Your clinic will never miss another patient call."** · subhead · buttons [primary clay **Book a demo** = magnetic + press-squish] [secondary ghost **See the dashboard**] · trust line "HIPAA-ready · SOC 2 in progress · Built with clinic operators".
- **Right:** one cohesive **DashboardFrame** (`rounded-clay-lg`, `shadow-clay`) — NOT scattered floating cards. Inside:
  1. **Live Calls** strip — pulsing green dot + "2 calls active" + 24-bar GSAP waveform.
  2. **Live Transcript** — types the seed transcript over ~6s, loops every ~12s.
  3. **Today's metrics** — 2–3 count-up numbers.
  4. **Recent callers** — 3 rows from seed.
- **Motion (entrance timeline, once, ≈1.2s, `power3.out`, 80ms stagger):** eyebrow → H1 lines (split, y+fade) → subhead → buttons → frame (scale 0.96→1 + fade). Then: waveform loop, transcript typer, gentle idle float on 2–3 frame chips (±4px, sine, 4–6s, staggered).
- **Dark:** soft violet radial glow behind frame (low opacity) so it isn't flat charcoal.

### 3. Problem
- Short headline + 3 clay cards quantifying missed-call pain ("After-hours calls captured: 312", front-desk overload, hold-time abandonment). Scroll-reveal stagger.

### 4. How it works (4-step clay flow)
- Steps: **Caller dials** → **VoiceAssist answers & understands** (Twilio · Deepgram · OpenAI) → **Acts** (books/reschedules/routes/answers FAQ) → **Logs to dashboard**. Numbered clay cards, connector line on desktop. Reveal stagger.

### 5. Metrics band (full-width clay panel)
- The 6 seed metrics as **count-up** numbers (1,247 · 94.2% · 38% · 11.4 hrs · 2m 14s · 312). Triggers on scroll-in; reduced-motion shows finals.

### 6. Dashboard feature deep-dive
- Alternating rows (text ↔ clay screenshot-style panel) for: Calls + transcripts, Appointments/scheduling, Patients, FAQ deflection. Reuses dashboard visual language (status pills, KPI tiles). Reveal per row.

### 7. Security / HIPAA
- Clay panel with ShieldIcon: HIPAA-ready, SOC 2 in progress, encryption at rest/in transit, audit log, data residency. Restrained, trust-building.

### 8. Social proof
- Logo row (regional systems): Northside Family Health · Bay Cove Medical Group · Cedar Valley Clinics · Helix Pediatrics · Meridian Primary Care. One quiet testimonial clay card.

### 9. Pricing
- 3 clay tiers (Starter / Clinic / Group — middle highlighted with accent rim + "Most popular"). Press-squish on CTA. Plausible value framing (per-location/mo), not invented hard claims beyond "contact for pricing" where unsure.

### 10. Final CTA
- Big clay panel, accent-tinted in dark via soft glow: "Stop letting the phone go to voicemail." → **Book a demo** (magnetic) + **See the dashboard**.

### 11. Footer
- Wordmark, nav columns (Product/Company/Legal), "HIPAA-ready · SOC 2 in progress", © 2026 VoiceAssist. Theme toggle echo.

---

## GSAP spec (exact, restrained — all inside `gsap.matchMedia`)
| Interaction | Values |
|---|---|
| Hero entrance | timeline, total ~1.2s, `power3.out`, stagger 80ms; frame `scale:0.96→1` |
| Scroll reveal | `y:24→0, opacity:0→1`, `stagger:0.08`, `start:"top 80%"`, `once:true` |
| Press-squish (buttons + key cards) | pointerdown → `scale:0.97` + `shadow-clay-pressed`, ~120ms |
| Magnetic CTA | hover → translate toward cursor max 6–8px, `scale:1.03`, shadow deepens; reset on leave |
| Card hover | `translateY(-4px)` + `shadow-clay-hover`, 200ms |
| Metric count-up | 0→target on scroll-in (`useCountUp` + ScrollTrigger) |
| Waveform | 24 bars, scaleY random 0.35–1, `sine.inOut`, center stagger, yoyo loop |
| Transcript typer | char-by-char ~6s, pause, loop ~12s |
| Idle float | ONLY 2–3 hero chips, ±4px, `sine.inOut`, 4–6s, staggered |

**Reduced motion** (`(prefers-reduced-motion: reduce)` branch of matchMedia): no entrance timeline, no reveals
(content visible), no waveform/typer/float loops, count-ups show final values. Page fully legible & unbroken when still.

## Light vs dark (only surfaces/shadows/glow change; layout & radii identical)
- Light: page `--clay-bg #EDEFF3`, cards `#FCFDFE`, neutral soft shadows, bright top highlight.
- Dark: page `#0F1116`, cards `#1C1F26` (lifted), faint top highlight (0.05), stronger underside, `rgba(255,255,255,0.06)` rim, soft violet hero glow. Re-derived — never inverted.

## Acceptance = the brief's checklist; self-verified before "done", plus `tsc`/`eslint`/`next build` green.
