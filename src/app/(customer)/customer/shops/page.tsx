import { FavoriteToggleButton } from "@/components/customer/favorite-toggle-button";
import { MobileTopBar } from "@/components/customer/mobile-chrome";
import { haversineDistanceKm } from "@/lib/delivery-quote";
import { getCustomerProfile, getInitials } from "@/services/customer";
import { listFavoriteShopIds } from "@/services/favorites";
import { getUnreadNotificationCount } from "@/services/notifications";
import { getVerifiedShops } from "@/services/shops";
import Link from "next/link";

export default async function CustomerShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; favorites?: string }>;
}) {
  const { q, sort, favorites } = await searchParams;
  const [shops, profile, favoriteShopIds, notificationCount] = await Promise.all([
    getVerifiedShops(q),
    getCustomerProfile(),
    listFavoriteShopIds(),
    getUnreadNotificationCount(),
  ]);
  const profileInitials = getInitials(profile?.first_name ?? null, profile?.surname ?? null) || "TW";
  const locationLabel = profile?.address?.trim() || "Set location";
  const userLat = profile?.preferred_lat;
  const userLng = profile?.preferred_lng;
  const sortMode = sort === "rating" || sort === "price" || sort === "nearest" ? sort : "nearest";
  const favoritesOnly = favorites === "1";

  const shopsWithDistance = shops
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
    });

  const favoriteSet = new Set(favoriteShopIds);
  const filteredShops = favoritesOnly ? shopsWithDistance.filter((shop) => favoriteSet.has(shop.id)) : shopsWithDistance;

  const sortedShops = [...filteredShops].sort((a, b) => {
    if (sortMode === "rating") {
      return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
    }

    if (sortMode === "price") {
      return a.starting_price - b.starting_price;
    }

    if (a.distance_km === null && b.distance_km === null) return 0;
    if (a.distance_km === null) return 1;
    if (b.distance_km === null) return -1;
    return a.distance_km - b.distance_km;
  });

  return (
    <main className="space-y-5">
      <MobileTopBar
        searchPlaceholder="Find laundromats..."
        searchAction="/customer/shops"
        searchValue={q}
        searchHiddenFields={{ sort: sortMode, favorites: favoritesOnly ? "1" : undefined }}
        locationLabel={locationLabel}
        profileInitials={profileInitials}
        notificationCount={notificationCount}
      />

      <section className="space-y-1">
        <h1 className="text-3xl font-black text-primary-500">All Laundromats</h1>
        <p className="text-sm text-text-secondary/70">Browse verified shops near your location.</p>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Link
            href={`/customer/shops?${new URLSearchParams({ q: q ?? "", sort: "nearest", ...(favoritesOnly ? { favorites: "1" } : {}) }).toString()}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${sortMode === "nearest" ? "bg-primary-500 text-white" : "bg-white text-text-secondary"}`}
          >
            Nearest
          </Link>
          <Link
            href={`/customer/shops?${new URLSearchParams({ q: q ?? "", sort: "rating", ...(favoritesOnly ? { favorites: "1" } : {}) }).toString()}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${sortMode === "rating" ? "bg-primary-500 text-white" : "bg-white text-text-secondary"}`}
          >
            Top Rated
          </Link>
          <Link
            href={`/customer/shops?${new URLSearchParams({ q: q ?? "", sort: "price", ...(favoritesOnly ? { favorites: "1" } : {}) }).toString()}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${sortMode === "price" ? "bg-primary-500 text-white" : "bg-white text-text-secondary"}`}
          >
            Lowest Price
          </Link>
          <Link
            href={`/customer/shops?${new URLSearchParams({ q: q ?? "", sort: sortMode, ...(favoritesOnly ? {} : { favorites: "1" }) }).toString()}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${favoritesOnly ? "bg-primary-500 text-white" : "bg-white text-text-secondary"}`}
          >
            Favorites Only
          </Link>
        </div>
      </section>

      {sortedShops.length === 0 ? (
        <div className="rounded-2xl border border-border-muted bg-white p-5 text-sm text-text-muted shadow-soft">
          {favoritesOnly ? "No favorite shops match this filter yet." : "No verified shops yet."}
        </div>
      ) : (
        <section className="space-y-3 pb-2">
          {sortedShops.map((shop, index) => (
            <article
              key={shop.id}
              className="overflow-hidden rounded-2xl border border-border-muted bg-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className="h-28 bg-gradient-to-r from-primary-500/85 via-primary-500/70 to-primary-500/45"
                style={{ opacity: 1 - index * 0.05 }}
              />
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-bold text-primary-500">{shop.shop_name}</h2>
                  {shop.promo_badge && (
                    <span className="rounded-full bg-primary-500 px-2 py-1 text-[11px] font-semibold text-white">{shop.promo_badge}</span>
                  )}
                </div>

                <p className="line-clamp-2 text-sm text-text-secondary">{shop.description || shop.location}</p>
                <p className="text-xs text-text-muted">
                  ⭐ {shop.rating_avg ?? 0} ({shop.total_reviews ?? 0}) · ETA {shop.eta_min ?? 45}-{shop.eta_max ?? 90} mins
                </p>
                {shop.distance_km !== null ? (
                  <p className="text-xs font-semibold text-primary-500">{shop.distance_km} km away</p>
                ) : (
                  <p className="text-xs text-text-muted">Set location to see distance</p>
                )}
                <p className="text-xs text-text-muted">Starts at ₱{shop.starting_price.toFixed(2)} · up to {shop.load_capacity_kg.toFixed(0)} kg/load</p>

                <div className="flex gap-2 pt-1">
                  <FavoriteToggleButton shopId={shop.id} initialIsFavorite={favoriteSet.has(shop.id)} />
                  <Link
                    className="inline-flex h-9 items-center rounded-xl bg-primary-500 px-3 text-xs font-semibold text-white transition hover:bg-primary-500/90"
                    href={`/customer/shops/${shop.id}`}
                  >
                    View Laundromat
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
