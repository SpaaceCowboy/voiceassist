import Link from "next/link";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}

export function SectionHeading({ eyebrow, title, href, linkLabel = "View all" }: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-widest text-ink-muted">{eyebrow}</p>
        )}
        <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="text-sm font-medium text-accent hover:text-accent-soft">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}