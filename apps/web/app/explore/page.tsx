import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DiscoveryExperience } from "@/features/discovery/discovery-experience";
import { getMarketplaceHome, getProducts } from "@/lib/api";
import type { ProductFilters } from "@/lib/types";
export const metadata: Metadata = { title: "Explore" };
export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const filters: ProductFilters = { q: first(raw.q), type: first(raw.type), category: first(raw.category), platform: first(raw.platform), price: first(raw.price), sort: first(raw.sort) ?? "featured", page: 1, limit: 12 };
  const [initial, home] = await Promise.all([getProducts(filters).catch(() => ({ data: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } })), getMarketplaceHome().catch(() => null)]);
  return (
    <>
      <Header />
      <DiscoveryExperience initial={initial} categories={home?.categories.map((item) => item.name) ?? []} initialFilters={filters} />
      <Footer />
    </>
  );
}
