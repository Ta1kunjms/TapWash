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


  // Dynamic greeting messages
  const greetings = {
    morning: [
      "Good morning! Ready for fresh laundry?",
      "Rise and shine! Laundry day awaits.",
      "Start your day with fresh clothes!",
      "A fresh morning for fresh laundry!",
      "Let’s make your morning brighter with clean laundry.",
      "Early bird gets the cleanest clothes!",
      "Good morning! Time to refresh your wardrobe.",
      "Wake up to a world of clean laundry!",
      "Kickstart your day with a laundry run!",
      "Sun’s up, laundry’s on!",
      "Fresh start, fresh laundry!",
      "Make your morning sparkle with clean clothes!",
      "Laundry magic for your morning routine!",
      "Good morning! Let’s get those clothes spotless.",
      "A new day, a new load!",
      "Morning breeze, fresh tees!",
      "Clean laundry, happy morning!",
      "Start strong with a laundry refresh!",
      "Bright mornings, brighter whites!",
      "Laundry joy to begin your day!",
      "Rise up, freshen up!",
      "Morning hustle, laundry bustle!",
      "Let’s make your morning laundry easy.",
      "Good morning! Laundry made simple.",
      "Fresh laundry, fresh mindset!",
      "Morning routine: coffee, laundry, win!",
      "Clean clothes, clean slate!",
      "Laundry love for your morning.",
      "Start your day the fresh way!",
      "Laundry done before noon—legendary!",
      "Good morning! Let’s tackle laundry together.",
      "A bright day starts with clean laundry.",
      "Morning motivation: fresh laundry!",
      "Laundry sorted, day started!",
      "Good morning! Your laundry awaits.",
      "Fresh laundry, fresh possibilities!",
      "Morning made better with clean clothes.",
      "Laundry first, everything else next!",
      "Good morning! Let’s get those stains out.",
      "Start your day with a laundry win!",
      "Laundry goals: achieved this morning.",
      "Good morning! Laundry is just a tap away.",
      "Fresh laundry, fresh energy!",
      "Morning vibes, laundry tribe!",
      "Laundry made easy for your morning.",
      "Good morning! Let’s freshen up your wardrobe.",
      "Laundry happiness delivered this morning.",
      "Start your day with a laundry smile!",
      "Good morning! Clean clothes, happy you.",
      "Laundry magic, morning edition!"
    ],
    afternoon: [
      "Good afternoon! Laundry made easy.",
      "Keep your day fresh with clean clothes!",
      "Afternoon is perfect for a laundry refresh.",
      "Laundry break? We’ve got you covered!",
      "Stay fresh all day—let’s do laundry!",
      "Midday clean, all-day confidence!",
      "Laundry time: afternoon edition.",
      "Brighten your afternoon with fresh laundry!",
      "Take a laundry break this afternoon!",
      "Clean clothes, happy afternoon!",
      "Laundry boost for your afternoon!",
      "Afternoon delight: fresh laundry!",
      "Laundry made simple, all afternoon.",
      "Refresh your day with a laundry run!",
      "Laundry sorted, afternoon rewarded!",
      "Good afternoon! Let’s freshen up your style.",
      "Laundry magic for your midday!",
      "Afternoon hustle, laundry muscle!",
      "Laundry done, afternoon fun!",
      "Clean laundry, clear mind!",
      "Afternoon pick-me-up: laundry!",
      "Laundry made effortless this afternoon.",
      "Good afternoon! Laundry is just a tap away.",
      "Laundry joy for your afternoon routine.",
      "Afternoon breeze, fresh tees!",
      "Laundry happiness, afternoon style!",
      "Laundry break, happiness make!",
      "Good afternoon! Let’s get those clothes spotless.",
      "Laundry sorted, day supported!",
      "Afternoon refresh, laundry success!",
      "Laundry made easy, all day long.",
      "Good afternoon! Let’s tackle laundry together.",
      "Laundry love for your afternoon.",
      "Afternoon routine: laundry and chill!",
      "Laundry done, afternoon won!",
      "Good afternoon! Your laundry awaits.",
      "Laundry goals: achieved this afternoon.",
      "Afternoon made better with clean clothes.",
      "Laundry first, everything else next!",
      "Good afternoon! Let’s get those stains out.",
      "Laundry sorted, afternoon started!",
      "Laundry magic, afternoon edition!",
      "Good afternoon! Clean clothes, happy you.",
      "Laundry happiness delivered this afternoon.",
      "Afternoon vibes, laundry tribe!",
      "Laundry made easy for your afternoon.",
      "Good afternoon! Let’s freshen up your wardrobe.",
      "Laundry smile, afternoon style!",
      "Laundry boost, afternoon toast!"
    ],
    evening: [
      "Good evening! Unwind with fresh laundry.",
      "End your day with clean comfort.",
      "Evenings are for cozy, clean clothes!",
      "Relax—your laundry is in good hands.",
      "Wind down with a laundry refresh.",
      "Laundry tonight, fresh tomorrow!",
      "Evening laundry, effortless comfort.",
      "Settle in with freshly cleaned clothes.",
      "Laundry done, evening won!",
      "Enjoy your evening—let us handle the laundry!",
      "Evening breeze, fresh tees!",
      "Laundry magic for your evening routine!",
      "Good evening! Let’s get those clothes spotless.",
      "A cozy night starts with clean laundry.",
      "Evening comfort, laundry sorted!",
      "Laundry love for your evening.",
      "Good evening! Laundry made simple.",
      "Fresh laundry, peaceful night!",
      "Evening routine: laundry and relax!",
      "Laundry sorted, night rewarded!",
      "Good evening! Let’s tackle laundry together.",
      "Laundry happiness, evening style!",
      "Laundry break, happiness make!",
      "Good evening! Let’s freshen up your style.",
      "Laundry sorted, night supported!",
      "Evening refresh, laundry success!",
      "Laundry made easy, all night long.",
      "Good evening! Your laundry awaits.",
      "Laundry goals: achieved this evening.",
      "Evening made better with clean clothes.",
      "Laundry first, everything else next!",
      "Good evening! Let’s get those stains out.",
      "Laundry sorted, evening started!",
      "Laundry magic, evening edition!",
      "Good evening! Clean clothes, happy you.",
      "Laundry happiness delivered this evening.",
      "Evening vibes, laundry tribe!",
      "Laundry made easy for your evening.",
      "Good evening! Let’s freshen up your wardrobe.",
      "Laundry smile, evening style!",
      "Laundry boost, evening toast!",
      "Laundry done, night won!",
      "Good evening! Laundry is just a tap away.",
      "Laundry joy for your evening routine.",
      "Evening breeze, fresh laundry!",
      "Laundry happiness, night style!",
      "Laundry break, night make!",
      "Good evening! Let’s get those clothes fresh.",
      "Laundry sorted, night started!"
    ]
  };

  function getTimeOfDay(): keyof typeof greetings {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  }

  function getRandomGreeting(): string {
    const timeOfDay = getTimeOfDay();
    const options = greetings[timeOfDay];
    return options[Math.floor(Math.random() * options.length)];
  }

  const greetingMessage = getRandomGreeting();

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
        <p className="text-lg text-text-secondary/65">{greetingMessage}</p>
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
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-text-secondary/80">Featured Laundromats</h2>
        </div>
        {featured.length === 0 ? (
          <div className="rounded-2xl border border-border-muted bg-white p-5 text-sm text-text-muted shadow-soft">
            {favoritesOnly ? "No favorite laundromats yet." : "No verified shops yet."}
          </div>
        ) : (
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 scrollbar-hidden">
            {featured.map((shop) => (
              <article
                key={shop.id}
                className="group min-w-[88%] snap-start overflow-hidden rounded-[1.85rem] border border-border-muted/70 bg-white shadow-[0_14px_35px_rgba(15,23,42,0.1)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.14)]"
              >
                <div className="relative aspect-[16/7] overflow-hidden bg-background-app">
                  {/* Robust image fallback: show logo if cover_image_url is missing, empty, or fails to load */}
                  <Image
                    src={
                      shop.cover_image_url && shop.cover_image_url.trim() && shop.cover_image_url.trim() !== ''
                        ? shop.cover_image_url.trim()
                        : "/tapwash-logo.png"
                    }
                    alt={shop.cover_image_url && shop.cover_image_url.trim() && shop.cover_image_url.trim() !== ''
                      ? `${shop.shop_name} laundromat cover image`
                      : "TapWash default laundromat cover image"}
                    fill
                    sizes="(max-width: 768px) 88vw, 360px"
                    className="object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
                    priority={true}
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
