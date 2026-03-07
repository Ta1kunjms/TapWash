import { FavoriteToggleButton } from "@/components/customer/favorite-toggle-button";
import { MobileTopBar } from "@/components/customer/mobile-chrome";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { haversineDistanceKm } from "@/lib/delivery-quote";
import { getVerifiedShopsWithServices } from "@/services/shops";
import { getCustomerProfile, getInitials } from "@/services/customer";
import { listFavoriteShopIds } from "@/services/favorites";
import { getUnreadNotificationCount } from "@/services/notifications";
import Link from "next/link";

export default async function CustomerHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; favorites?: string }>;
}) {
  const { q, favorites } = await searchParams;
  const favoritesOnly = favorites === "1";
  const [profile, favoriteShopIds, notificationCount] = await Promise.all([
    getCustomerProfile(),
    listFavoriteShopIds(),
    getUnreadNotificationCount(),
  ]);
  const firstName = profile?.first_name?.trim() || "Tycoon";
  const profileInitials = getInitials(profile?.first_name ?? null, profile?.surname ?? null) || "TW";
  const locationLabel = profile?.address?.trim() || "Set location";
  const userLat = profile?.preferred_lat;
  const userLng = profile?.preferred_lng;
  const favoriteSet = new Set(favoriteShopIds);
  const shops = await getVerifiedShopsWithServices(q);
  const featured = shops
    .map((shop) => {
      const canComputeDistance =
        typeof userLat === "number" &&
        typeof userLng === "number" &&
        typeof shop.lat === "number" &&
        typeof shop.lng === "number";

      return {
        ...shop,
        distance_km: canComputeDistance
          ? Number(haversineDistanceKm({ lat: userLat, lng: userLng }, { lat: shop.lat as number, lng: shop.lng as number }).toFixed(1))
          : null,
      };
    })
    .filter((shop) => (favoritesOnly ? favoriteSet.has(shop.id) : true))
    .sort((a, b) => {
      if (a.distance_km === null && b.distance_km === null) return 0;
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    })
    .slice(0, 5);

  return (
    <main className="space-y-5">
      <MobileTopBar
        searchPlaceholder="Find laundromats..."
        searchValue={q}
        searchAction="/customer"
        searchHiddenFields={{ favorites: favoritesOnly ? "1" : undefined }}
        locationLabel={locationLabel}
        profileInitials={profileInitials}
        notificationCount={notificationCount}
      />

      <section className="space-y-1">
        <h1 className="text-4xl font-black leading-tight text-primary-500">Hello {firstName}!</h1>
        <p className="text-lg text-text-secondary/65">Good morning! Ready for fresh laundry?</p>
        <div className="mt-3 h-px bg-border-muted" />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-secondary/80">Featured Laundromats</h2>
          <Link
            href={`/customer?${new URLSearchParams({ q: q ?? "", ...(favoritesOnly ? {} : { favorites: "1" }) }).toString()}`}
            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-500"
          >
            {favoritesOnly ? "Show All" : "Favorites Only"}
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="rounded-2xl border border-border-muted bg-white p-5 text-sm text-text-muted shadow-soft">
            {favoritesOnly ? "No favorite laundromats yet." : "No verified shops yet."}
          </div>
        ) : (
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
            {featured.map((shop, index) => (
              <article
                key={shop.id}
                className="min-w-[88%] snap-start overflow-hidden rounded-2xl border border-border-muted bg-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div
                  className="flex h-32 items-end bg-gradient-to-br from-primary-500/80 via-primary-500/60 to-primary-500/40 p-3"
                  style={{ opacity: 1 - index * 0.08 }}
                >
                  <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-primary-500">
                    ⭐ {shop.rating_avg ?? 0} ({shop.total_reviews ?? 0})
                  </span>
                </div>
                <div className="space-y-1.5 p-3">
                  <h3 className="line-clamp-1 text-base font-bold text-primary-500">{shop.shop_name}</h3>
                  <p className="line-clamp-1 text-sm text-text-secondary">{shop.location}</p>
                  {shop.distance_km !== null ? (
                    <p className="text-xs font-semibold text-primary-500">{shop.distance_km} km away</p>
                  ) : (
                    <p className="text-xs text-text-muted">Set location to see distance</p>
                  )}
                  <p className="line-clamp-1 text-xs text-text-muted">{shop.services.map((service) => service.name).join(", ") || "Laundry services available"}</p>
                  <div className="flex gap-2 pt-1">
                    <FavoriteToggleButton shopId={shop.id} initialIsFavorite={favoriteSet.has(shop.id)} />
                    <Link
                      className="inline-flex h-9 items-center rounded-xl bg-primary-500 px-3 text-xs font-semibold text-white"
                      href={`/customer/shops/${shop.id}`}
                    >
                      View Laundromat
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-text-secondary/80">Special Offers</h2>
        <div className="rounded-2xl bg-gradient-to-r from-primary-500 via-primary-500/90 to-primary-500/70 p-4 text-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs font-semibold tracking-widest text-white/85">LIMITED PROMO</p>
          <p className="mt-1 text-2xl font-black">Flash Sale up to 50% OFF</p>
          <p className="mt-1 text-sm text-white/85">Apply vouchers on checkout and enjoy same-day pickup.</p>
        </div>
      </section>

      <section className="space-y-3 pb-2">
        <h2 className="text-xl font-bold text-text-secondary/80">Service Map</h2>
        <div className="overflow-hidden rounded-2xl border border-border-muted bg-white shadow-soft">
          <div className="h-40 bg-[linear-gradient(135deg,rgba(30,136,229,0.14)_0%,rgba(30,136,229,0.06)_55%,rgba(255,255,255,0.95)_100%)] p-4">
            <div className="flex h-full items-end justify-between">
              <div>
                <p className="text-sm font-semibold text-text-secondary">Nearby coverage area</p>
                <p className="text-xs text-text-muted">Live route estimate appears during booking.</p>
              </div>
              <Link
                href="/customer/shops"
                className="inline-flex items-center gap-1 rounded-xl bg-primary-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-500/90"
              >
                <FlaticonIcon name="plus" className="text-xs" />
                Explore Shops
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
