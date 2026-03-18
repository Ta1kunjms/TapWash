import { FavoriteToggleButton } from "@/components/customer/favorite-toggle-button";
import { MobileTopBar } from "@/components/customer/mobile-chrome";
import { haversineDistanceKm } from "@/lib/delivery-quote";
import { getSelectedCustomerAddress } from "@/services/addresses";
import { getCustomerProfile, getInitials } from "@/services/customer";
import { listFavoriteShopIds } from "@/services/favorites";
import { getUnreadNotificationCount } from "@/services/notifications";
import { getVerifiedShops } from "@/services/shops";
import Image from "next/image";
import Link from "next/link";

export default async function CustomerShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; favorites?: string }>;
}) {
  const { q, sort, favorites } = await searchParams;
  const [shops, profile, selectedAddress, favoriteShopIds, notificationCount] = await Promise.all([
    getVerifiedShops(q),
    getCustomerProfile(),
    getSelectedCustomerAddress(),
    listFavoriteShopIds(),
    getUnreadNotificationCount(),
  ]);
  const profileInitials = getInitials(profile?.first_name ?? null, profile?.surname ?? null) || "TW";
  const locationLabel = selectedAddress?.address_line?.trim() || profile?.address?.trim() || "Set location";
  const userLat = selectedAddress?.lat ?? profile?.preferred_lat;
  const userLng = selectedAddress?.lng ?? profile?.preferred_lng;
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
          {sortedShops.map((shop) => (
            <article
              key={shop.id}
              className="overflow-hidden rounded-[1.75rem] border border-border-muted bg-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative">
                <div className="relative aspect-[16/7] overflow-hidden bg-gradient-to-r from-primary-500/85 via-primary-500/70 to-primary-500/45">
                  <Image
                    src={shop.cover_image_url?.trim() || "/tapwash-logo.png"}
                    alt={`${shop.shop_name} cover`}
                    fill
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.26)_100%)]" />
                </div>

                <div className="absolute bottom-0 left-4 h-16 w-16 translate-y-1/2 overflow-hidden rounded-full border-4 border-white bg-primary-500/10 shadow-md">
                  {shop.cover_image_url?.trim() ? (
                    <Image
                      src={shop.cover_image_url}
                      alt={`${shop.shop_name} logo`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-full w-full items-center justify-center text-sm font-black uppercase text-primary-500">
                      {getShopInitials(shop.shop_name)}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 p-4 pt-10">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="line-clamp-1 text-lg font-bold text-primary-500">{shop.shop_name}</h2>
                  {shop.promo_badge && (
                    <span className="rounded-full bg-primary-500 px-2 py-1 text-[11px] font-semibold text-white">{shop.promo_badge}</span>
                  )}
                </div>

                <p className="line-clamp-2 text-sm text-text-secondary">{shop.description || shop.location}</p>
                {shop.distance_km !== null ? (
                  <p className="text-xs font-semibold text-primary-500">{shop.distance_km} km away</p>
                ) : (
                  <p className="text-xs text-text-muted">Set location to see distance</p>
                )}

                <div className="mt-2 flex flex-col gap-3 border-t border-border-muted/70 pt-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="grid flex-1 grid-cols-3 overflow-hidden rounded-2xl border border-border-muted/70 bg-background-app/40">
                    <p className="px-2 py-2 text-center text-xs font-semibold text-text-secondary">
                      ⭐ {shop.rating_avg ?? 0} ({shop.total_reviews ?? 0})
                    </p>
                    <p className="border-x border-border-muted/70 px-2 py-2 text-center text-xs font-semibold text-text-secondary">
                      ETA {shop.eta_min ?? 45}-{shop.eta_max ?? 90} mins
                    </p>
                    <p className="px-2 py-2 text-center text-xs font-semibold text-text-secondary">
                      Starts at ₱{shop.starting_price.toFixed(2)} · up to {shop.load_capacity_kg.toFixed(0)} kg/load
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <FavoriteToggleButton shopId={shop.id} initialIsFavorite={favoriteSet.has(shop.id)} />
                    <Link
                      className="inline-flex h-10 items-center rounded-full bg-primary-500 px-4 text-xs font-semibold text-white transition hover:bg-primary-500/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                      href={`/customer/shops/${shop.id}`}
                    >
                      View Laundromat
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function getShopInitials(name: string): string {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "TW";
}
