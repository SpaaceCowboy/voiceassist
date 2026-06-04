"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/components/themeToggle";
import { useAuthStore, type AuthState } from "@/store/auth";
import { logout } from "@/lib/authApi";
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  HeartPulseIcon,
  PhoneIcon,
  ChartIcon,
  LayersIcon,
  HelpIcon,
  ActivityIcon,
  LogsIcon,
} from "@/components/ui/icons";

const NAV_SECTIONS = [
  {
    title: null,
    items: [{ href: "/dashboard", label: "Dashboard", Icon: HomeIcon }],
  },
  {
    title: "Operations",
    items: [
      { href: "/appointments", label: "Appointments", Icon: CalendarIcon },
      { href: "/patients", label: "Patients", Icon: HeartPulseIcon },
      { href: "/calls", label: "Calls", Icon: PhoneIcon },
    ],
  },
  {
    title: "Insights",
    items: [{ href: "/analytics", label: "Analytics", Icon: ChartIcon }],
  },
  {
    title: "Knowledge",
    items: [{ href: "/faqs", label: "FAQs", Icon: HelpIcon }],
  },
  {
    title: "System",
    items: [
      { href: "/dashboard/logs", label: "Live Activity", Icon: LogsIcon },
      { href: "/sessions", label: "Sessions", Icon: LayersIcon },
      { href: "/status", label: "Status", Icon: ActivityIcon },
      { href: "/users", label: "Users", Icon: UsersIcon },
    ],
  },
] as const;

function NavLink({
  href,
  pathname,
  Icon,
  children,
}: {
  href: string;
  pathname: string;
  Icon: (p: { size?: number; className?: string }) => React.ReactNode;
  children: React.ReactNode;
}) {
  const active =
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? "bg-[rgb(var(--accent))]/15 text-[rgb(var(--accent))] font-medium"
          : "text-[rgb(var(--text))] hover:bg-[rgb(var(--surface2))]"
      }`}
    >
      <span
        className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[rgb(var(--accent))] transition-opacity ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
      <Icon
        size={18}
        className={active ? "opacity-100" : "opacity-60 group-hover:opacity-90"}
      />
      <span>{children}</span>
    </Link>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s: AuthState) => s.user);
  const authenticated = useAuthStore((s: AuthState) => s.authenticated);
  const isLoggedIn = Boolean(user || authenticated);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside
      className="fixed left-0 top-0 w-60 h-screen flex flex-col z-40"
      style={{
        background: "rgb(var(--surface))",
        borderRight: "1px solid rgb(var(--border))",
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-center gap-2.5 px-1 pt-1">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl font-bold text-white"
            style={{
              background:
                "linear-gradient(135deg, rgb(var(--accent)) 0%, rgba(var(--accent),0.7) 100%)",
              boxShadow: "0 4px 14px rgba(var(--accent),0.30)",
            }}
          >
            N
          </span>
          <div className="leading-tight">
            <div className="font-semibold" style={{ color: "rgb(var(--text))" }}>
              NeuroSpine
            </div>
            <div className="text-[11px]" style={{ color: "rgb(var(--muted))" }}>
              Voice Assistant
            </div>
          </div>
        </div>
        <ThemeToggle />
        <nav className="space-y-4">
          {NAV_SECTIONS.map((section, i) => (
            <div key={section.title ?? `top-${i}`} className="space-y-0.5">
              {section.title ? (
                <div
                  className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "rgb(var(--muted))" }}
                >
                  {section.title}
                </div>
              ) : null}
              {section.items.map(({ href, label, Icon }) => (
                <NavLink key={href} href={href} pathname={pathname} Icon={Icon}>
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </div>

      {isLoggedIn && (
        <div
          className="mt-auto p-4 pt-0"
          style={{ borderTop: "1px solid rgb(var(--border))" }}
        >
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((o) => !o)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition hover:bg-[rgb(var(--surface2))]"
              style={{ color: "rgb(var(--text))" }}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "rgb(var(--accent))",
                  color: "white",
                }}
              >
                <UserIcon className="w-5 h-5" />
              </div>
              <span className="flex-1 text-left text-sm font-medium truncate">
                {user?.email ?? "Profile"}
              </span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div
                className="absolute bottom-full left-0 right-0 mb-1 py-1 rounded-xl shadow-lg"
                style={{
                  background: "rgb(var(--surface))",
                  border: "1px solid rgb(var(--border))",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    void logout().finally(() => {
                      window.location.href = "/login";
                    });
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition rounded-lg hover:bg-[rgb(var(--surface2))]"
                  style={{ color: "rgb(var(--text))" }}
                >
                  <LogoutIcon className="w-4 h-4 shrink-0" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
