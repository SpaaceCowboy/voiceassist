import { ReaderAccount } from "@/components/ReaderAccount";
import { getLocale } from "@/lib/serverLocale";

export const metadata = { title: "Reader account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const locale = await getLocale();
  return <ReaderAccount locale={locale} />;
}
