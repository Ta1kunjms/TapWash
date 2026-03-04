import { Card } from "@/components/ui/card";
import { getVerifiedShopsWithServices } from "@/services/shops";
import Link from "next/link";

export default async function CustomerHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const shops = await getVerifiedShopsWithServices(q);

  return (
    <main className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">Foodpanda-Style Laundry Discovery</h1>
        <form className="flex gap-2" action="/customer">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search shop or location"
            className="h-11 w-full rounded-2xl border border-border-muted bg-white px-3 text-sm"
          />
          <button className="h-11 rounded-2xl bg-primary-500 px-4 text-sm font-semibold text-white" type="submit">
            Search
          </button>
        </form>
      </div>
      {shops.length === 0 && <Card>No verified shops yet.</Card>}
      {shops.map((shop) => (
        <Card key={shop.id}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{shop.shop_name}</h2>
            {shop.promo_badge && (
              <span className="rounded-full bg-primary-500 px-2 py-1 text-xs font-semibold text-white">{shop.promo_badge}</span>
            )}
          </div>
          <p className="text-sm text-text-secondary">{shop.location}</p>
          <p className="text-xs text-text-muted">⭐ {shop.rating_avg ?? 0} ({shop.total_reviews ?? 0}) · ETA {shop.eta_min ?? 45}-{shop.eta_max ?? 90} mins</p>
          <p className="text-sm text-text-muted">Starts at ₱{shop.price_per_kg}/kg · {shop.services.length} services</p>
          <Link
            className="mt-2 inline-block text-sm font-semibold text-primary-500"
            href={`/customer/orders/new?q=${encodeURIComponent(shop.shop_name)}`}
          >
            Order from this shop
          </Link>
        </Card>
      ))}
    </main>
  );
}
