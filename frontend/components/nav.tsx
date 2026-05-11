"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/components/themeToggle";
import { useAuthStore, type AuthState } from "@/store/auth";
import { logout } from "@/lib/authApi";

function NavLink({
  href,
  pathname,
  children,
}: {
  href: string;
  pathname: string;
  children: React.ReactNode;
}) {
  const active =
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`block px-3 py-2.5 rounded-xl text-sm transition ${
        active
          ? "bg-[rgb(var(--accent))]/15 text-[rgb(var(--accent))] font-medium"
          : "text-[rgb(var(--text))] hover:bg-[rgb(var(--surface2))]"
      }`}
    >
      {children}
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

  const token = useAuthStore((s: AuthState) => s.token);
  const user = useAuthStore((s: AuthState) => s.user);
  const isLoggedIn = !!(token || user);

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
      <div className="p-4 flex flex-col gap-4">
        <div
          className="font-semibold text-lg"
          style={{ color: "rgb(var(--text))" }}
        >
          ERP Dashboard
        </div>
        <ThemeToggle />
        <nav className="space-y-0.5">
          <NavLink href="/dashboard" pathname={pathname}>
            Dashboard
          </NavLink>
          <NavLink href="/appointments" pathname={pathname}>
            Appointments
          </NavLink>
          <NavLink href="/patients" pathname={pathname}>
            Patients
          </NavLink>
          <NavLink href="/reservations" pathname={pathname}>
            Reservations
          </NavLink>
          <NavLink href="/calls" pathname={pathname}>
            Calls
          </NavLink>
          <NavLink href="/faqs" pathname={pathname}>
            FAQs
          </NavLink>
          <NavLink href="/status" pathname={pathname}>
            Status
          </NavLink>
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
                Profile
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
                    logout();
                    window.location.href = "/login";
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
