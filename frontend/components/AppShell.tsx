"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { Nav } from "@/components/nav";
import { getMe } from "@/lib/authApi";
import { useAuthStore } from "@/store/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const { user, setUser, setAuthenticated } = useAuthStore.getState();

    if (!user) {
      getMe().then((u) => {
        if (u) {
          setUser(u);
          setAuthenticated(true);
        }
      });
    }
  }, []);

  const pathname = usePathname();

  const isAuth =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup");

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="ml-60 min-w-0 flex-1 px-6 py-6 lg:px-10 lg:py-8">
        <div key={pathname} className="mx-auto w-full max-w-[1400px] animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
