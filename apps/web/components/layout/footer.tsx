"use client";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "./logo";
import { useLocale } from "@/lib/locale-context";
import { localePath } from "@/lib/i18n";

const COLUMNS = [
  { heading: "Marketplace", links: ["Explore", "Collections", "New releases"] },
  { heading: "Create", links: ["Start selling", "Creator guide", "Quality standards"] },
  { heading: "Company", links: ["About", "Journal", "Support"] },
] as const;

export function Footer() {
  const { locale, t } = useLocale();
  return (
    <footer className="relative isolate mt-24 overflow-hidden border-t border-border bg-surface/40">
      {/* A last, quiet echo of the hero's plasma so the page closes on the
          same note it opened with. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-64 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(50% 100% at 20% 0%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 70%), radial-gradient(45% 100% at 82% 0%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 72%)",
        }}
      />

      <div className="container-page grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Logo concept="pure" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            {t.footer}
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-verified/30 bg-verified/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-verified">
            <ShieldCheck size={12} />
            Permissions on every listing
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.heading}>
            <h3 className="eyebrow">{column.heading}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link}>
                  <Link
                    href={localePath("/explore", locale)}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border/70 py-5">
        <p className="container-page font-mono text-[11px] text-muted-foreground">
          © 2026 termspace · Concept prototype · Local mock data only
        </p>
      </div>
    </footer>
  );
}
