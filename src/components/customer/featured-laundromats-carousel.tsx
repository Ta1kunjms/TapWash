"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FavoriteToggleButton } from "./favorite-toggle-button";

interface FeaturedShop {
  id: string;
  shop_name: string;
  distance_km: number | null;
  rating_avg: number | null;
  cover_image_url?: string;
  services?: Array<{ name: string }>;
  recentReviewerAvatars?: Array<{ avatar_key: string }>;
}

interface FeaturedLaundromatCarouselProps {
  featured: FeaturedShop[];
  favoriteSet: Set<string>;
}

export function FeaturedLaundromatCarousel({
  featured,
  favoriteSet,
}: FeaturedLaundromatCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || featured.length === 0) return;

    const SCROLL_INTERVAL = 3000; // 3 seconds
    const GAP = 12; // gap-3 = 0.75rem = 12px
    const CARD_WIDTH_PERCENT = 88; // min-w-[88%]

    let cardWidth = 0;

    const calculateCardWidth = () => {
      const containerWidth = container.clientWidth;
      return (containerWidth * CARD_WIDTH_PERCENT) / 100;
    };

    const autoScroll = () => {
      if (isUserScrollingRef.current) return; // Skip if user is scrolling
      if (container.scrollWidth <= container.clientWidth) return;

      cardWidth = calculateCardWidth();
      const scrollAmount = cardWidth + GAP;
      const maxScroll = container.scrollWidth - container.clientWidth;
      let newPosition = container.scrollLeft + scrollAmount;

      if (newPosition >= maxScroll) {
        newPosition = 0;
      }

      container.scrollTo({
        left: newPosition,
        behavior: "smooth",
      });
    };

    const handleScroll = () => {
      isUserScrollingRef.current = true;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 5000); // Resume auto-scroll after 5 seconds of inactivity
    };

    const intervalId = setInterval(autoScroll, SCROLL_INTERVAL);
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearInterval(intervalId);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      container.removeEventListener("scroll", handleScroll);
    };
  }, [featured.length]);

  if (featured.length === 0) {
    return (
      <div className="rounded-2xl border border-border-muted bg-white p-5 text-sm text-text-muted shadow-soft">
        No verified shops yet.
      </div>
    );
  }

  return (
    <>
      {/* Scroll Container with Affordance Indicators */}
      <div className="relative">
        {/* Left Gradient Fade (Desktop affordance hint) */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-white/80 to-transparent hidden md:block" />
        {/* Right Gradient Fade (Desktop affordance hint) */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white/80 to-transparent hidden md:block" />

        <div
          ref={scrollContainerRef}
          className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 scrollbar-hidden"
        >
          {featured.map((shop) => (
            <article
              key={shop.id}
              className="group min-w-[82%] snap-start overflow-hidden rounded-[1.5rem] border border-border-muted/60 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.18)]"
            >
              <Link href={`/customer/shops/${shop.id}`} className="block">
                <div className="relative overflow-hidden rounded-[1.2rem] bg-background-app">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[1.05rem]">
                    <Image
                      src={
                        shop.cover_image_url &&
                        shop.cover_image_url.trim() &&
                        shop.cover_image_url.trim() !== ""
                          ? shop.cover_image_url.trim()
                          : "/tapwash-logo.png"
                      }
                      alt={
                        shop.cover_image_url &&
                        shop.cover_image_url.trim() &&
                        shop.cover_image_url.trim() !== ""
                          ? `${shop.shop_name} laundromat cover image`
                          : "TapWash default laundromat cover image"
                      }
                      fill
                      sizes="(max-width: 768px) 88vw, 360px"
                      className="object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
                      priority={true}
                    />
                    {/* Subtle gradient overlay (reduced from original) */}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.03)_0%,rgba(15,23,42,0.08)_100%)]" />
                  </div>

                  {/* Active Status Indicator - Compact */}
                  <div className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/85 px-2 py-0.5 text-[11px] font-semibold text-text-secondary shadow-sm backdrop-blur">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    <span>Active</span>
                  </div>

                  {/* Favorite Toggle Button */}
                  <FavoriteToggleButton
                    shopId={shop.id}
                    initialIsFavorite={favoriteSet.has(shop.id)}
                    variant="icon"
                    className="absolute right-2.5 top-2.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/85 text-primary-500 shadow-sm backdrop-blur transition-all duration-150 hover:bg-white hover:shadow-md"
                  />
                </div>
              </Link>

              {/* Content Section - Info-Centric Layout */}
              <div className="space-y-2 px-0.5 pb-0.5 pt-2.5">
                {/* Header: Shop Name (Primary Focus) */}
                <h3 className="line-clamp-1 text-[1.05rem] font-extrabold leading-tight tracking-tight text-text-secondary hover:text-primary-500 transition-colors">
                  {shop.shop_name}
                </h3>

                {/* Meta Row: Rating | Distance (Key Decision Info) */}
                <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                  <span className="flex items-center gap-0.5">
                    ⭐ {shop.rating_avg !== null ? `${shop.rating_avg.toFixed(1)}` : "4.8"}
                  </span>
                  <span>•</span>
                  <span>{shop.distance_km !== null ? `${shop.distance_km} km` : "Nearby"}</span>
                </div>

                {/* Services Section (Essential for decisions) */}
                {shop.services &&
                  Array.isArray(shop.services) &&
                  shop.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {shop.services.slice(0, 2).map((service, idx) => (
                        <span
                          key={`${shop.id}-service-${idx}`}
                          className="inline-flex items-center rounded-full bg-primary-500/12 px-2.5 py-1 text-[10px] font-semibold text-primary-600 transition-all duration-150 group-hover:bg-primary-500/20"
                        >
                          {service.name || "Service"}
                        </span>
                      ))}
                    </div>
                  )}

                {/* Social Proof + CTA Row */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center">
                    {(shop.recentReviewerAvatars &&
                    shop.recentReviewerAvatars.length > 0
                      ? shop.recentReviewerAvatars
                          .slice(0, 3)
                          .map((avatar) => avatar.avatar_key || "Achiever")
                      : ["Achiever", "Athlete", "Designer"]
                    ).map((avatarName, index) => (
                      <div
                        key={`${shop.id}-proof-${index}`}
                        className="-ml-1.5 inline-flex h-5.5 w-5.5 items-center justify-center rounded-full border-2 border-white bg-primary-100 text-[0.55rem] font-bold text-primary-600 shadow-sm transition-all duration-150 group-hover:shadow-md"
                      >
                        {avatarName.slice(0, 1)}
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/customer/shops/${shop.id}`}
                    className="inline-flex shrink-0 items-center rounded-full bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-150 hover:bg-primary-600 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  >
                    View
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Mobile Scroll Indicator (optional visual cue for small screens) */}
      {featured.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5 md:hidden">
          {featured.slice(0, 5).map((_, index) => (
            <div
              key={`indicator-${index}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === 0 ? "w-6 bg-primary-500" : "w-1.5 bg-border-muted"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
