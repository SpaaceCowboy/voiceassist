import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "term_academy_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPersian = pathname === "/fa" || pathname.startsWith("/fa/");
  const effectivePath = isPersian ? pathname.slice(3) || "/" : pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-term-locale", isPersian ? "fa" : "en");

  if (!effectivePath.startsWith("/admin") || effectivePath === "/admin/login") {
    if (!isPersian) return NextResponse.next({ request: { headers: requestHeaders } });
    const rewriteUrl = request.nextUrl.clone(); rewriteUrl.pathname = effectivePath;
    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }

  if (request.cookies.has(ADMIN_COOKIE)) {
    if (!isPersian) return NextResponse.next({ request: { headers: requestHeaders } });
    const rewriteUrl = request.nextUrl.clone(); rewriteUrl.pathname = effectivePath;
    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
