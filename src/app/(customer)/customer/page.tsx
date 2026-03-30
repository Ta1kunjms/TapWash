import { HomeLaundromatFeed } from "@/components/customer/home-laundromat-feed";
import { HomeOfferCard } from "@/components/customer/home-offer-card";
import { HomeGreetingMascotRotator } from "@/components/customer/home-greeting-mascot-rotator";
import { MobileTopBar } from "@/components/customer/mobile-chrome";
import { ServiceAreaMap } from "@/components/customer/service-area-map";
import { FeaturedLaundromatCarousel } from "@/components/customer/featured-laundromats-carousel";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { haversineDistanceKm } from "@/lib/delivery-quote";
import { getSelectedCustomerAddress } from "@/services/addresses";
import { getVerifiedShopsWithServices, getShopRecentReviewerAvatars } from "@/services/shops";
import { getCustomerProfile, getInitials } from "@/services/customer";
import { listFavoriteShopIds } from "@/services/favorites";
import { getActiveHomeOffers } from "@/services/home-offers";
import { getUnreadNotificationCount } from "@/services/notifications";

import Link from "next/link";

export default async function CustomerHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; favorites?: string }>;
}) {
  const { q, favorites } = await searchParams;
  const favoritesOnly = favorites === "1";
  const [profile, selectedAddress, favoriteShopIds, notificationCount, homeOffers] = await Promise.all([
    getCustomerProfile(),
    getSelectedCustomerAddress(),
    listFavoriteShopIds(),
    getUnreadNotificationCount(),
    getActiveHomeOffers(4),
  ]);
  const firstName = profile?.first_name?.trim() || "Tycoon";
  const profileInitials = getInitials(profile?.first_name ?? null, profile?.surname ?? null) || "TW";
  const locationLabel = selectedAddress?.address_line?.trim() || profile?.address?.trim() || "Set location";
  const userLat = selectedAddress?.lat ?? profile?.preferred_lat;
  const userLng = selectedAddress?.lng ?? profile?.preferred_lng;
  const favoriteSet = new Set(favoriteShopIds);
  const shops = await getVerifiedShopsWithServices(q, { limit: 200 });
  const baseFiltered = shops
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

  // Fetch recent reviewer avatars for each featured shop in parallel.
  const featuredWithAvatars = await Promise.all(
    baseFiltered.map(async (shop) => {
      const recentAvatars = await getShopRecentReviewerAvatars(shop.id, 3);
      return {
        ...shop,
        recentReviewerAvatars: recentAvatars,
      };
    }),
  );

  const featured = featuredWithAvatars;


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

  function selectGreeting(timeOfDay: keyof typeof greetings, seed: string): string {
    const options = greetings[timeOfDay];
    if (options.length === 0) return "Welcome to TapWash";

    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }

    const index = hash % options.length;
    return options[index];
  }

  const timeOfDay = getTimeOfDay();
  const greetingSeed = (firstName ?? "tapwash").trim() || "tapwash";
  const greetingMessage = selectGreeting(timeOfDay, greetingSeed);
  const hasPhoneOnProfile = Boolean(profile?.phone?.trim());

  return (
    <main className="space-y-5">
      <MobileTopBar
        searchPlaceholder="Find laundromats..."
        searchValue={q}
        searchAction="/customer"
        searchHiddenFields={{ favorites: favoritesOnly ? "1" : undefined }}
        locationLabel={locationLabel}
        profileInitials={profileInitials}
        profileAvatarKey={profile?.avatar_key}
        notificationCount={notificationCount}
      />

      <section className="space-y-1">
        <div className="flex items-center gap-0.5 sm:gap-2">
          <HomeGreetingMascotRotator />
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold leading-tight text-primary-500">Hello {firstName}!</h1>
            <p className="text-base text-text-secondary/65">{greetingMessage}</p>
          </div>
        </div>
        <div className="mt-3 h-px bg-border-muted" />
      </section>

      {!hasPhoneOnProfile ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-900">Add your contact number before checkout</p>
              <p className="text-xs leading-relaxed text-amber-800/90">
                You can browse shops now, but placing an order requires a valid phone number.
              </p>
            </div>
            <Link
              href="/customer/settings/profile"
              className="inline-flex shrink-0 items-center rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
            >
              Update Profile
            </Link>
          </div>
        </section>
      ) : null}

      {homeOffers.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-text-secondary/80">Special Offers</h2>
          <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 scrollbar-hidden">
            {homeOffers.map((offer) => (
              <HomeOfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Featured Laundromats section moved below Special Offers */}
      <section className="space-y-3">
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-text-secondary/80">Featured Laundromats</h2>
        </div>
        <FeaturedLaundromatCarousel featured={featured} favoriteSet={favoriteSet} />
      </section>

      <section className="space-y-3 pb-2">
        <h2 className="text-xl font-bold text-text-secondary/80">Service Map</h2>
        <div className="overflow-hidden rounded-2xl border border-border-muted bg-white shadow-soft">
          {featured.length > 0 ? (
            <ServiceAreaMap
              shops={featured
                .filter((shop) => typeof shop.lat === "number" && typeof shop.lng === "number")
                .map((shop) => ({
                  id: shop.id,
                  shop_name: shop.shop_name,
                  lat: shop.lat as number,
                  lng: shop.lng as number,
                }))}
              userLocation={typeof userLat === "number" && typeof userLng === "number" ? { lat: userLat, lng: userLng } : undefined}
            />
          ) : (
            <div className="h-40 bg-[linear-gradient(135deg,rgba(30,136,229,0.14)_0%,rgba(30,136,229,0.06)_55%,rgba(255,255,255,0.95)_100%)] p-4">
              <div className="flex h-full items-end justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-secondary">Nearby coverage area</p>
                  <p className="text-xs text-text-muted">No mappable laundromats available yet.</p>
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
          )}
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
