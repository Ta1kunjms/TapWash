import { FavoriteToggleButton } from "@/components/customer/favorite-toggle-button";
import { MobileTopBar } from "@/components/customer/mobile-chrome";
import { getSelectedCustomerAddress } from "@/services/addresses";
import { getFavoriteShops } from "@/services/favorites";
import { getCustomerProfile, getInitials } from "@/services/customer";
import { getUnreadNotificationCount } from "@/services/notifications";
import Link from "next/link";

export default async function CustomerFavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [profile, selectedAddress] = await Promise.all([
    getCustomerProfile(),
    getSelectedCustomerAddress(),
  ]);
  const notificationCount = await getUnreadNotificationCount();
  const profileInitials = getInitials(profile?.first_name ?? null, profile?.surname ?? null) || "TW";
  const locationLabel = selectedAddress?.address_line?.trim() || profile?.address?.trim() || "Set location";
  const favorites = await getFavoriteShops({
    search: q,
    preferredLat: selectedAddress?.lat ?? profile?.preferred_lat,
    preferredLng: selectedAddress?.lng ?? profile?.preferred_lng,
  });

  return (
    <main className="space-y-4">
      <MobileTopBar
        searchPlaceholder="Find favorites..."
        searchAction="/customer/favorites"
        searchValue={q}
        locationLabel={locationLabel}
        profileInitials={profileInitials}
        profileAvatarKey={profile?.avatar_key}
        notificationCount={notificationCount}
      />

      {favorites.length === 0 ? (
        <section className="rounded-2xl border border-border-muted bg-background-app/40 px-4 py-12 text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-500/20 text-5xl text-primary-500">
            ♡
          </div>
          <h1 className="text-3xl font-black text-primary-500/80">No favorites yet</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-primary-500/70">
            Save laundromats you love to access them quickly next time.
          </p>
        </section>
      ) : (
        <section className="space-y-3 pb-2">
          {favorites.map((shop) => (
            <article key={shop.id} className="rounded-2xl border border-border-muted bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold text-primary-500">{shop.shop_name}</h2>
                {shop.distance_km !== null ? (
                  <span className="text-xs font-semibold text-primary-500">{shop.distance_km} km</span>
                ) : (
                  <span className="text-xs text-text-muted">Set location to see distance</span>
                )}
              </div>
              <p className="mt-1 text-sm text-text-secondary">{shop.location}</p>
              <p className="mt-1 text-xs text-text-muted">⭐ {shop.rating_avg ?? 0} ({shop.total_reviews ?? 0})</p>
              <div className="mt-3 flex gap-2">
                <FavoriteToggleButton shopId={shop.id} initialIsFavorite variant="pill" />
                <Link
                  className="inline-flex h-9 items-center rounded-xl bg-primary-500 px-3 text-xs font-semibold text-white"
                  href={`/customer/shops/${shop.id}`}
                >
                  View Laundromat
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
