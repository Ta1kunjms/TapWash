import { FavoriteToggleButton } from "@/components/customer/favorite-toggle-button";
import { HomeLaundromatFeed } from "@/components/customer/home-laundromat-feed";
import { MobileTopBar } from "@/components/customer/mobile-chrome";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { haversineDistanceKm } from "@/lib/delivery-quote";
import { getSelectedCustomerAddress } from "@/services/addresses";
import { getVerifiedShops } from "@/services/shops";
import { getCustomerProfile, getInitials } from "@/services/customer";
import { listFavoriteShopIds } from "@/services/favorites";
import { getUnreadNotificationCount } from "@/services/notifications";
import Link from "next/link";
import Image from "next/image";

export default async function CustomerHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; favorites?: string }>;
}) {
  const { q, favorites } = await searchParams;
  const favoritesOnly = favorites === "1";
  const [profile, selectedAddress, favoriteShopIds, notificationCount] = await Promise.all([
    getCustomerProfile(),
    getSelectedCustomerAddress(),
    listFavoriteShopIds(),
    getUnreadNotificationCount(),
  ]);
  const firstName = profile?.first_name?.trim() || "Tycoon";
  const profileInitials = getInitials(profile?.first_name ?? null, profile?.surname ?? null) || "TW";
  const locationLabel = selectedAddress?.address_line?.trim() || profile?.address?.trim() || "Set location";
  const userLat = selectedAddress?.lat ?? profile?.preferred_lat;
  const userLng = selectedAddress?.lng ?? profile?.preferred_lng;
  const favoriteSet = new Set(favoriteShopIds);
  const shops = await getVerifiedShops(q);
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
        <h1 className="text-3xl font-bold leading-tight text-primary-500">Hello {firstName}!</h1>
        <p className="text-lg text-text-secondary/65">Good morning! Ready for fresh laundry?</p>
        <div className="mt-3 h-px bg-border-muted" />
      </section>

      {/* Special Offers section moved above Featured Laundromats */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-text-secondary/80">Special Offers</h2>
        <div className="rounded-2xl bg-gradient-to-r from-primary-500 via-primary-500/90 to-primary-500/70 p-4 text-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-xs font-semibold tracking-widest text-white/85">LIMITED PROMO</p>
          <p className="mt-1 text-2xl font-black">Flash Sale up to 50% OFF</p>
          <p className="mt-1 text-sm text-white/85">Apply vouchers on checkout and enjoy same-day pickup.</p>
        </div>
      </section>

      {/* Featured Laundromats section moved below Special Offers */}
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
            {featured.map((shop) => (
              <article
                key={shop.id}
                className="group min-w-[88%] snap-start overflow-hidden rounded-[1.85rem] border border-border-muted/70 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.1)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.14)]"
              >
                <div className="relative aspect-[16/7] overflow-hidden bg-background-app">
                  <Image
                    src={shop.cover_image_url?.trim() || "/tapwash-logo.png"}
                    alt={`${shop.shop_name} laundromat cover image`}
                    fill
                    sizes="(max-width: 768px) 88vw, 360px"
                    className="object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.12)_65%,rgba(15,23,42,0.28)_100%)]" />

                  <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-xs font-semibold text-text-secondary shadow-sm backdrop-blur-sm">
                    <span className="text-amber-500">★</span>
                    <span>{shop.rating_avg ?? 0}</span>
                    <span className="text-text-muted">({shop.total_reviews ?? 0})</span>
                  </div>

                  <FavoriteToggleButton
                    shopId={shop.id}
                    initialIsFavorite={favoriteSet.has(shop.id)}
                    variant="icon"
                    className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/90 text-primary-500 shadow-sm backdrop-blur-sm transition hover:bg-white"
                  />
                </div>

                <div className="space-y-3 p-4">
                  <div className="space-y-1.5">
                    <h3 className="line-clamp-1 text-[1.18rem] font-extrabold leading-tight tracking-tight text-text-secondary">
                      {shop.shop_name}
                    </h3>
                    <p className="line-clamp-1 text-sm font-medium text-text-secondary/80">{shop.location}</p>
                    <p className="line-clamp-2 text-xs leading-relaxed text-text-muted">
                      {shop.description?.trim() || "Laundry services available"}
                    </p>
                  </div>

                  {/* Removed ETA / DISTANCE / TOP SERVICE row as requested */}

                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    <span className="text-xs font-medium text-text-muted min-w-[72px] text-left">
                      {shop.distance_km !== null ? `${shop.distance_km} km away` : "Set location"}
                    </span>
                    <Link
                      className="inline-flex h-10 items-center rounded-full bg-primary-500 px-5 text-xs font-semibold text-white transition hover:bg-primary-500/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
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

      <HomeLaundromatFeed
        initialQuery={q}
        userLat={typeof userLat === "number" ? userLat : null}
        userLng={typeof userLng === "number" ? userLng : null}
        favoriteShopIds={favoriteShopIds}
      />

    </main>
  );
}
