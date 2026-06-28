"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import {
  NAV_LINKS,
  PROBLEMS,
  STEPS,
  FEATURES,
  SECURITY,
  TESTIMONIAL,
  LOGOS,
  TIERS,
} from "./data";
import { useScrolled } from "./hooks";
import {
  ClayCard,
  ClayPill,
  ClayButton,
  AccentDot,
  Wordmark,
  ThemeButton,
  SectionHeading,
  ICONS,
} from "./primitives";
import { DashboardFrame } from "./DashboardFrame";
import { FeatureMock } from "./FeatureMocks";
import { MetricsBand } from "./MetricsBand";
import { ShieldIcon } from "@/components/ui/icons";

/* ===================================================================== */
/* Nav                                                                   */
/* ===================================================================== */
function Nav() {
  const scrolled = useScrolled(8);
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 transition-[margin,background,border-color,box-shadow,border-radius] duration-300 sm:px-6"
        style={
          scrolled
            ? {
                marginTop: "10px",
                borderRadius: "9999px",
                background: "rgb(var(--clay-surface) / 0.85)",
                border: "1px solid var(--clay-border)",
                boxShadow: "var(--clay-shadow)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                // isolate the blurred bar on its own layer so it doesn't
                // force a full-page repaint while scrolling
                transform: "translateZ(0)",
                willChange: "transform",
              }
            : {
                marginTop: "0px",
                background: "transparent",
                border: "1px solid transparent",
                transform: "translateZ(0)",
              }
        }
      >
        <Wordmark />

        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:opacity-70">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="hidden text-sm font-medium transition hover:opacity-70 sm:block"
          >
            Sign in
          </Link>
          <ThemeButton />
          <ClayButton href="/dashboard" className="hidden sm:inline-flex !px-5 !py-2.5">
            Book demo
          </ClayButton>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
            className="clay-press bg-clay-surface grid h-10 w-10 place-items-center rounded-full border shadow-clay md:hidden"
            style={{ borderColor: "var(--clay-border)" }}
          >
            <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* mobile overlay */}
      {open && (
        <div className="px-5 md:hidden">
          <ClayCard className="mt-2 p-4">
            <nav className="flex flex-col gap-1 text-sm font-medium">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 transition hover:bg-[rgb(var(--surface2))]"
                >
                  {l.label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 transition hover:bg-[rgb(var(--surface2))]"
              >
                Sign in
              </Link>
              <ClayButton href="/dashboard" className="mt-2">
                Book demo
              </ClayButton>
            </nav>
          </ClayCard>
        </div>
      )}
    </header>
  );
}

/* ===================================================================== */
/* Hero                                                                  */
/* ===================================================================== */
function Hero() {
  return (
    <section className="relative mx-auto max-w-[1180px] px-6 pb-12 pt-28 sm:pt-36">
      {/* dark-mode teal glow + floating decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[6%] top-[8%] -z-10 h-72 w-72 rounded-full opacity-50 blur-3xl"
        style={{ background: "rgb(var(--accent) / 0.18)", transform: "translateZ(0)" }}
      />
      <div
        aria-hidden
        data-float
        className="bg-clay-surface pointer-events-none absolute left-[2%] top-[36%] -z-10 hidden h-16 w-16 rounded-clay border shadow-clay lg:block"
        style={{ borderColor: "var(--clay-border)" }}
      />
      <div
        aria-hidden
        data-float
        className="bg-clay-surface pointer-events-none absolute right-[3%] bottom-[6%] -z-10 hidden h-10 w-10 rounded-clay-sm border shadow-clay lg:block"
        style={{ borderColor: "var(--clay-border)" }}
      />

      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span data-hero-item className="inline-block">
            <ClayPill>
              <AccentDot />
              Now in pilot with 40+ clinics
            </ClayPill>
          </span>

          <h1
            data-hero-item
            className="mt-6 text-[2.6rem] font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]"
          >
            Your clinic will never miss another{" "}
            <span
              style={{
                background:
                  "linear-gradient(120deg, rgb(var(--accent)), rgb(var(--accent2)))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              patient call.
            </span>
          </h1>

          <p
            data-hero-item
            className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg"
            style={{ color: "rgb(var(--muted))" }}
          >
            VoiceAssist answers, books, reschedules, and routes — 24/7 — then
            hands your team a clean dashboard of everything that happened.
          </p>

          <div data-hero-item className="mt-8 flex flex-wrap items-center gap-3">
            <ClayButton href="/dashboard">Book a demo</ClayButton>
            <ClayButton href="#dashboard" variant="ghost">
              See the dashboard
            </ClayButton>
          </div>

          <div
            data-hero-item
            className="mt-7 flex items-center gap-2 text-xs font-medium"
            style={{ color: "rgb(var(--muted))" }}
          >
            <ShieldIcon size={15} />
            HIPAA-ready · SOC 2 in progress · Built with clinic operators
          </div>
        </div>

        <DashboardFrame />
      </div>
    </section>
  );
}

/* ===================================================================== */
/* Problem                                                               */
/* ===================================================================== */
function Problem() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 py-16 sm:py-24">
      <SectionHeading
        eyebrow="The cost of a ringing phone"
        title="Every missed call is a patient who called someone else."
        subtitle="The front desk can only pick up one line at a time. The rest leak away — quietly, all day."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {PROBLEMS.map((p) => (
          <ClayCard key={p.title} data-reveal interactive className="p-7">
            <div className="text-3xl font-bold tracking-tight" style={{ color: "rgb(var(--accent))" }}>
              {p.stat}
            </div>
            <div className="mt-1 text-lg font-semibold">{p.title}</div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgb(var(--muted))" }}>
              {p.body}
            </p>
          </ClayCard>
        ))}
      </div>
    </section>
  );
}

/* ===================================================================== */
/* How it works                                                          */
/* ===================================================================== */
function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1180px] px-6 py-16 sm:py-24">
      <SectionHeading
        eyebrow="How it works"
        title="From “ring” to “booked” in one conversation."
        subtitle="No menus. No transfers. Just a conversation that ends in a result — and a record."
      />
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <ClayCard key={s.n} data-reveal interactive className="relative p-7">
            <div
              className="text-sm font-bold tracking-widest"
              style={{ color: "rgb(var(--accent))" }}
            >
              {s.n}
            </div>
            <div className="mt-3 text-lg font-semibold">{s.title}</div>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgb(var(--muted))" }}>
              {s.body}
            </p>
          </ClayCard>
        ))}
      </div>
    </section>
  );
}

/* ===================================================================== */
/* Feature deep-dive (alternating rows)                                  */
/* ===================================================================== */
function FeatureDeepDive() {
  return (
    <section id="product" className="mx-auto max-w-[1180px] px-6 py-16 sm:py-24">
      <SectionHeading
        eyebrow="One dashboard"
        title="Everything the assistant does, in plain sight."
        subtitle="The same calm dashboard your team already knows — now fed in real time by every call."
      />
      <div className="mt-16 space-y-16">
        {FEATURES.map((f, i) => {
          const reversed = i % 2 === 1;
          const Icon = ICONS[f.icon];
          return (
            <div
              key={f.title}
              data-reveal
              className="grid items-center gap-8 lg:grid-cols-2"
            >
              <div className={reversed ? "lg:order-2" : ""}>
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl"
                  style={{ background: "rgb(var(--accent) / 0.12)", color: "rgb(var(--accent))" }}
                >
                  {Icon ? <Icon size={24} /> : null}
                </span>
                <h3 className="mt-5 text-2xl font-bold tracking-tight">{f.title}</h3>
                <p className="mt-3 max-w-md text-base leading-relaxed" style={{ color: "rgb(var(--muted))" }}>
                  {f.body}
                </p>
              </div>
              <div className={reversed ? "lg:order-1" : ""}>
                <FeatureMock icon={f.icon} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ===================================================================== */
/* Security                                                              */
/* ===================================================================== */
function Security() {
  return (
    <section id="security" className="mx-auto max-w-[1180px] px-6 py-16 sm:py-24">
      <ClayCard className="overflow-hidden p-8 sm:p-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div data-reveal>
            <span
              className="grid h-12 w-12 place-items-center rounded-2xl"
              style={{ background: "rgb(var(--accent) / 0.12)", color: "rgb(var(--accent))" }}
            >
              <ShieldIcon size={24} />
            </span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight">
              Built for patient data from day one.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: "rgb(var(--muted))" }}>
              Every call and transcript is handled under healthcare-grade controls — so the
              convenience never comes at the cost of compliance.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {SECURITY.map((s) => {
              const Icon = ICONS[s.icon];
              return (
                <div
                  key={s.title}
                  data-reveal
                  className="rounded-2xl border p-5"
                  style={{ background: "rgb(var(--surface2))", borderColor: "var(--clay-border)" }}
                >
                  <span style={{ color: "rgb(var(--accent))" }}>
                    {Icon ? <Icon size={22} /> : null}
                  </span>
                  <div className="mt-3 text-sm font-semibold">{s.title}</div>
                  <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "rgb(var(--muted))" }}>
                    {s.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </ClayCard>
    </section>
  );
}

/* ===================================================================== */
/* Social proof                                                          */
/* ===================================================================== */
function SocialProof() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 py-16 sm:py-20">
      <p
        data-reveal
        className="text-center text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ color: "rgb(var(--muted))" }}
      >
        Trusted by clinics that can&rsquo;t afford a missed call
      </p>
      <div
        data-reveal
        className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-center text-sm font-semibold"
        style={{ color: "rgb(var(--muted))" }}
      >
        {LOGOS.map((l) => (
          <span key={l} className="opacity-80">
            {l}
          </span>
        ))}
      </div>

      <ClayCard data-reveal className="mx-auto mt-12 max-w-3xl p-8 sm:p-10">
        <p className="text-xl font-medium leading-relaxed tracking-tight sm:text-2xl">
          &ldquo;{TESTIMONIAL.quote}&rdquo;
        </p>
        <div className="mt-6 text-sm">
          <span className="font-semibold">{TESTIMONIAL.name}</span>
          <span style={{ color: "rgb(var(--muted))" }}> · {TESTIMONIAL.org}</span>
        </div>
      </ClayCard>
    </section>
  );
}

/* ===================================================================== */
/* Pricing                                                               */
/* ===================================================================== */
function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-[1180px] px-6 py-16 sm:py-24">
      <SectionHeading
        eyebrow="Pricing"
        title="One predictable price per location."
        subtitle="No per-minute billing, no surprises. Cancel anytime."
      />
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {TIERS.map((t) => (
          <ClayCard
            key={t.name}
            data-reveal
            interactive
            className="relative flex flex-col p-8"
            style={
              t.featured
                ? { borderColor: "rgb(var(--accent) / 0.5)", borderWidth: "1.5px" }
                : undefined
            }
          >
            {t.featured && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                style={{ background: "rgb(var(--accent))" }}
              >
                Most popular
              </span>
            )}
            <div className="text-sm font-semibold" style={{ color: "rgb(var(--accent))" }}>
              {t.name}
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-4xl font-bold tracking-tight">{t.price}</span>
              <span className="text-sm" style={{ color: "rgb(var(--muted))" }}>
                {t.cadence}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgb(var(--muted))" }}>
              {t.blurb}
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0" style={{ color: "rgb(var(--accent))" }}>
                    {ICONS.CheckCircleIcon({ size: 17 })}
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <ClayButton
                href="/dashboard"
                variant={t.featured ? "primary" : "ghost"}
                className="w-full"
              >
                {t.cta}
              </ClayButton>
            </div>
          </ClayCard>
        ))}
      </div>
    </section>
  );
}

/* ===================================================================== */
/* Final CTA                                                             */
/* ===================================================================== */
function FinalCTA() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 py-16 sm:py-24">
      <ClayCard data-reveal className="relative overflow-hidden px-8 py-16 text-center sm:px-16 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(40rem 22rem at 50% -10%, rgb(var(--accent) / 0.16), transparent 60%)",
          }}
        />
        <h2 className="relative text-3xl font-bold tracking-tight sm:text-[2.6rem]">
          Stop letting the phone go to voicemail.
        </h2>
        <p
          className="relative mx-auto mt-4 max-w-lg text-base sm:text-lg"
          style={{ color: "rgb(var(--muted))" }}
        >
          See VoiceAssist answer, book and log a real call — then watch it land on
          your dashboard.
        </p>
        <div className="relative mt-9 flex flex-wrap justify-center gap-3">
          <ClayButton href="/dashboard">Book a demo</ClayButton>
          <ClayButton href="#dashboard" variant="ghost">
            See the dashboard
          </ClayButton>
        </div>
      </ClayCard>
    </section>
  );
}

/* ===================================================================== */
/* Footer                                                                */
/* ===================================================================== */
function Footer() {
  const cols = [
    { title: "Product", links: ["How it works", "Dashboard", "Security", "Pricing"] },
    { title: "Company", links: ["About", "Careers", "Contact"] },
    { title: "Legal", links: ["Privacy", "Terms", "HIPAA", "BAA"] },
  ];
  return (
    <footer className="px-6 pb-12 pt-8">
      <div
        className="mx-auto max-w-[1180px] pt-10"
        style={{ borderTop: "1px solid var(--clay-border)" }}
      >
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-sm" style={{ color: "rgb(var(--muted))" }}>
              The AI receptionist that answers, books and logs every patient call —
              so your front desk never misses one.
            </p>
            <p className="mt-4 text-xs font-medium" style={{ color: "rgb(var(--muted))" }}>
              HIPAA-ready · SOC 2 in progress
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-sm font-semibold">{c.title}</div>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: "rgb(var(--muted))" }}>
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="transition hover:opacity-70">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="mt-10 flex flex-col items-center justify-between gap-3 pt-6 text-xs sm:flex-row"
          style={{ borderTop: "1px solid var(--clay-border)", color: "rgb(var(--muted))" }}
        >
          <span>© 2026 VoiceAssist · NeuroSpine Institute</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="transition hover:opacity-70">
              Sign in
            </Link>
            <ThemeButton />
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ===================================================================== */
/* Page shell + GSAP orchestration                                       */
/* ===================================================================== */
export function Landing() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.registerPlugin(ScrollTrigger);

        // Hero entrance (once)
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from("[data-hero-item]", { y: 28, opacity: 0, duration: 0.8, stagger: 0.08 })
          .from(
            "[data-hero-visual]",
            { scale: 0.96, opacity: 0, duration: 0.9, ease: "power2.out" },
            "-=0.5"
          );

        // Scroll reveals
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            scrollTrigger: { trigger: el, start: "top 82%", once: true },
            y: 24,
            opacity: 0,
            duration: 0.7,
            ease: "power2.out",
          });
        });

        // Idle float — ONLY the 2–3 [data-float] hero elements
        gsap.utils.toArray<HTMLElement>("[data-float]").forEach((el, i) => {
          gsap.to(el, {
            y: i % 2 === 0 ? -8 : -6,
            duration: 4 + i,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            delay: i * 0.4,
          });
        });
      });
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      className="relative isolate min-h-screen overflow-x-clip"
      style={{ background: "rgb(var(--clay-bg))", color: "rgb(var(--text))" }}
    >
      <Nav />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <MetricsBand />
        <FeatureDeepDive />
        <Security />
        <SocialProof />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
