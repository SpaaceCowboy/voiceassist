import "server-only";
import { cookies } from "next/headers";

export async function getAdminCookieHeader(): Promise<string> {
  return (await cookies()).toString();
}
