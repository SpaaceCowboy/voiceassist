import { NextResponse, type NextRequest } from "next/server";

const TOKEN_KEY = "auth-token";

function isPublicPath(pathname: string) {
  // allow auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) return true;

  // allow Next internals/static
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;

  // allow API routes (proxy, status checks, etc.)
  if (pathname.startsWith("/api")) return true;

  // allow public assets
  if (pathname.startsWith("/public")) return true;

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const token = req.cookies.get(TOKEN_KEY)?.value;

  // If no token, force login
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
