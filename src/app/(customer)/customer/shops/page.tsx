import { Card } from "@/components/ui/card";
import { getVerifiedShops } from "@/services/shops";
import Link from "next/link";

export default async function CustomerShopsPage() {
  const shops = await getVerifiedShops();

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Shops</h1>
      {shops.map((shop) => (
        <Card key={shop.id}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{shop.shop_name}</h2>
            {shop.promo_badge && (
              <span className="rounded-full bg-primary-500 px-2 py-1 text-xs font-semibold text-white">{shop.promo_badge}</span>
            )}
          </div>
          <p className="text-sm text-text-secondary">{shop.description}</p>
          <p className="text-xs text-text-muted">⭐ {shop.rating_avg ?? 0} ({shop.total_reviews ?? 0}) · ETA {shop.eta_min ?? 45}-{shop.eta_max ?? 90} mins</p>
          <Link className="mt-2 inline-block text-sm text-primary-500" href={`/customer/orders?shop=${shop.id}`}>
            Book now
          </Link>
        </Card>
      ))}
    </main>
  );
}
