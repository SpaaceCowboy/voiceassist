import "server-only";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "term_academy_session";

export async function getAdminCookieHeader(): Promise<string> {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return value ? `${ADMIN_COOKIE}=${encodeURIComponent(value)}` : "";
}
