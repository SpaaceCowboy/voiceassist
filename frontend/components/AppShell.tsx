"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Nav } from "@/components/nav";
import { useAuthStore, type AuthState } from "@/store/auth";
import { getMe } from "@/lib/authApi";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s: AuthState) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const { token, user, setUser } = useAuthStore.getState();
    if (token && !user) {
      getMe().then((u) => {
        if (u) setUser(u);
      });
    }
  }, []);
  const pathname = usePathname();
  const isAuth =
    pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 ml-60 p-6 min-w-0">{children}</main>
    </div>
  );
}
