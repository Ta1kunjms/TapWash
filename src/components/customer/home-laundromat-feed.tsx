
"use client";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";

import { FavoriteToggleButton } from "@/components/customer/favorite-toggle-button";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRecentViews } from "@/hooks/use-recent-views";

type SortMode =
  | "alphabetical_asc"
  | "alphabetical_desc"
  | "rating_desc"
  | "reviews_desc"
  | "nearest"
  | "eta_asc"
  | "price_asc"
  | "discount_desc"
  | "open_now";

type FeedItem = {
  id: string;
  shop_name: string;
  description: string | null;
  location: string;
  cover_image_url: string | null;
  starting_price: number;
  load_capacity_kg: number;
  rating_avg: number | null;
  total_reviews: number | null;
  promo_badge: string | null;
  eta_min: number | null;
  eta_max: number | null;
  distance_km: number | null;
  service_names: string[];
  status: "open" | "low_capacity" | "closing_soon" | "closed";
  status_label: string;
  social_proof: string;
  trust_badges: string[];
};

type FeedResponse = {
  items: FeedItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

type Props = {
  initialQuery?: string;
  userLat: number | null;
  userLng: number | null;
  favoriteShopIds: string[];
};

const DEFAULT_LIMIT = 8;

const SORT_OPTIONS: Array<{ value: SortMode; label: string }> = [
  { value: "alphabetical_asc", label: "Alphabetical A-Z" },
  { value: "alphabetical_desc", label: "Alphabetical Z-A" },
  { value: "nearest", label: "Nearest Distance" },
  { value: "rating_desc", label: "Highest Rated" },
  { value: "reviews_desc", label: "Most Reviewed" },
  { value: "eta_asc", label: "Fastest Pickup/Delivery ETA" },
  { value: "price_asc", label: "Lowest Starting Price" },
  { value: "discount_desc", label: "Highest Discount" },
  { value: "open_now", label: "Open Now First" },
];

export function HomeLaundromatFeed({ initialQuery, userLat, userLng, favoriteShopIds }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const { addRecentView } = useRecentViews();

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<(() => Promise<void>) | null>(null);

  const hasLocation = typeof userLat === "number" && typeof userLng === "number";

  const smartSortDefault = hasLocation ? "nearest" : "rating_desc";
  const sortValue = parseSort(searchParams.get("feedSort"), smartSortDefault);

  const currentSortIndex = SORT_OPTIONS.findIndex((option) => option.value === sortValue);
  const currentSortLabel =
    currentSortIndex >= 0 ? SORT_OPTIONS[currentSortIndex].label : SORT_OPTIONS[0].label;

  const buildQueryString = useCallback(
    (next: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(next).forEach(([key, value]) => {
        if (!value) {
          params.delete(key);
          return;
        }
        params.set(key, value);
      });
      return params.toString();
    },
    [searchParams],
  );

  const updateParam = useCallback(
    (next: Record<string, string | null | undefined>) => {
      const queryString = buildQueryString(next);
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [buildQueryString, pathname, router],
  );

  const cycleSortMode = useCallback(() => {
    const nextIndex = currentSortIndex < 0 ? 0 : (currentSortIndex + 1) % SORT_OPTIONS.length;
    const nextSort = SORT_OPTIONS[nextIndex]?.value ?? SORT_OPTIONS[0].value;
    updateParam({ feedSort: nextSort });
  }, [currentSortIndex, updateParam]);

  const fetchPage = useCallback(
    async (pageValue: number) => {
      const params = new URLSearchParams();
      params.set("page", String(pageValue));
      params.set("limit", String(DEFAULT_LIMIT));
      params.set("sort", sortValue);
      if (initialQuery?.trim()) params.set("q", initialQuery.trim());
      if (typeof userLat === "number") params.set("userLat", String(userLat));
      if (typeof userLng === "number") params.set("userLng", String(userLng));

      const response = await fetch(`/api/customer/shops-feed?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load laundromats.");
      }

      const payload = (await response.json()) as FeedResponse;
      return payload;
    },
    [initialQuery, sortValue, userLat, userLng],
  );

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = await fetchPage(1);
      setItems(payload.items);
      setPage(1);
      setTotal(payload.total);
      setHasMore(payload.hasMore);
    } catch (error) {
      setItems([]);
      setHasMore(false);
      setErrorMessage(error instanceof Error ? error.message : "Could not load laundromats.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setErrorMessage(null);

    try {
      const nextPage = page + 1;
      const payload = await fetchPage(nextPage);
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        const nextItems = payload.items.filter((item) => !seen.has(item.id));
        return [...current, ...nextItems];
      });
      setPage(nextPage);
      setTotal(payload.total);
      setHasMore(payload.hasMore);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not load more laundromats.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, hasMore, isLoading, isLoadingMore, page]);

  loadMoreRef.current = loadMore;

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (!loadMoreRef.current) return;
        void loadMoreRef.current();
      },
      { rootMargin: "220px 0px" },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  const handleOpenDetail = useCallback((shop: FeedItem) => {
    addRecentView({ id: shop.id, name: shop.shop_name });
  }, [addRecentView]);

  // Compare feature removed

  return (
    <section className="space-y-3 pb-6" id="all-laundromats-feed">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-text-secondary/80">All Laundromats Near You</h2>
        <p className="text-sm text-text-muted">Discover, compare, and choose from every laundromat on TapWash.</p>
      </div>

      <div className="flex justify-end items-center gap-2 mt-2 mb-4">
        <span className="text-sm text-text-secondary/70 font-medium">Sort:</span>
        <button
          type="button"
          onClick={cycleSortMode}
          className="px-4 py-2 rounded-xl border border-border-muted bg-white text-sm font-semibold text-text-secondary transition hover:bg-primary-500/10 focus-visible:ring-2 focus-visible:ring-primary-500/40"
          aria-label={`Sort: ${currentSortLabel}. Tap to switch to the next sort mode.`}
          title="Tap to cycle sort mode"
        >
          {currentSortLabel}
        </button>
      </div>

      {/* Compare feature removed */}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <FeedSkeletonCard key={`skeleton-${index}`} />
          ))}
        </div>
      ) : null}

      {!isLoading && errorMessage ? (
        <div className="rounded-2xl border border-border-muted bg-white p-5 text-sm text-text-secondary shadow-soft">
          <p>{errorMessage}</p>
          <button
            type="button"
            className="mt-3 rounded-xl bg-primary-500 px-3 py-2 text-xs font-semibold text-white"
            onClick={() => void loadInitial()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <div className="rounded-2xl border border-border-muted bg-white p-5 text-sm text-text-secondary shadow-soft">
          <p className="font-semibold">No laundromats available right now.</p>
          <p className="mt-1 text-text-muted">Please try again in a few moments.</p>
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((shop) => {
          // Compare feature removed
          return (
            <article
              key={shop.id}
              className="grid grid-cols-[5.5rem_1fr_auto] gap-3 rounded-[1.35rem] border border-border-muted bg-white p-2 shadow-soft"
            >
              <Link
                href={`/customer/shops/${shop.id}`}
                onClick={() => handleOpenDetail(shop)}
                className="relative h-[5.5rem] w-[5.5rem] overflow-hidden rounded-2xl bg-background-app"
              >
                <Image
                  src={shop.cover_image_url?.trim() || "/tapwash-logo.png"}
                  alt={`${shop.shop_name} preview`}
                  fill
                  sizes="88px"
                  className="object-cover"
                />
              </Link>

              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/customer/shops/${shop.id}`}
                    onClick={() => handleOpenDetail(shop)}
                    className="line-clamp-1 text-base font-bold text-text-secondary"
                  >
                    {shop.shop_name}
                  </Link>
                  <span className={statusBadgeClass(shop.status)}>{shop.status_label}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                  {shop.description?.trim() || shop.location || "Quality laundry care with doorstep pickup."}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {shop.trust_badges.slice(0, 2).map((badge) => (
                    <span key={`${shop.id}-${badge}`} className="rounded-full bg-background-app px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                      {badge}
                    </span>
                  ))}
                  {shop.promo_badge ? (
                    <span className="rounded-full bg-[#fff4dd] px-2 py-0.5 text-[10px] font-semibold text-[#b97200]">
                      {shop.promo_badge}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-text-muted">
                  <span>⭐ {(shop.rating_avg ?? 0).toFixed(1)} ({shop.total_reviews ?? 0})</span>
                  <span>{shop.distance_km !== null ? `${shop.distance_km} km` : "Distance n/a"}</span>
                </div>
                <p className="mt-1 text-[11px] font-medium text-primary-500">{shop.social_proof}</p>
                <p className="text-[1.05rem] font-black text-primary-500">P{shop.starting_price.toFixed(2)}</p>
              </div>

              <div className="flex flex-col items-end justify-between gap-2">
                <FavoriteToggleButton
                  shopId={shop.id}
                  initialIsFavorite={favoriteShopIds.includes(shop.id)}
                  variant="icon"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-500/15 bg-primary-500/10 text-primary-500"
                />
                <Link
                  href={`/customer/shops/${shop.id}`}
                  onClick={() => handleOpenDetail(shop)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-white"
                  aria-label={`View ${shop.shop_name}`}
                >
                  <FlaticonIcon name="shopping-basket" className="text-lg" ariaHidden={false} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {isLoadingMore ? (
        <div className="space-y-3">
          <FeedSkeletonCard />
          <FeedSkeletonCard />
        </div>
      ) : null}

      {!isLoading && !isLoadingMore && !hasMore && items.length > 0 ? (
        <div className="rounded-xl border border-border-muted bg-white p-3 text-center text-xs font-semibold text-text-muted">
          You have reached all laundromats ({total}).
        </div>
      ) : null}

      <div ref={sentinelRef} className="h-2" aria-hidden />
    </section>
  );
}

function parseSort(value: string | null, fallback: SortMode): SortMode {
  if (!value) return fallback;
  const found = SORT_OPTIONS.find((option) => option.value === value);
  return found ? found.value : fallback;
}

function statusBadgeClass(status: FeedItem["status"]): string {
  if (status === "open") return "rounded-full bg-[#ddf5e9] px-2 py-0.5 text-[10px] font-bold text-[#177245]";
  if (status === "closing_soon") return "rounded-full bg-[#fff2ce] px-2 py-0.5 text-[10px] font-bold text-[#af7a03]";
  if (status === "low_capacity") return "rounded-full bg-[#ffe8d6] px-2 py-0.5 text-[10px] font-bold text-[#bf5b09]";
  return "rounded-full bg-[#f1f1f1] px-2 py-0.5 text-[10px] font-bold text-[#555]";
}

function FeedSkeletonCard() {
  return (
    <div className="grid grid-cols-[5.5rem_1fr_auto] gap-3 rounded-[1.35rem] border border-border-muted bg-white p-2 shadow-soft">
      <div className="h-[5.5rem] w-[5.5rem] animate-pulse rounded-2xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
      <div className="space-y-2">
        <div className="h-4 w-4/5 animate-pulse rounded bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
        <div className="h-3 w-full animate-pulse rounded bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
        <div className="h-5 w-20 animate-pulse rounded bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100" />
      </div>
      <div className="flex flex-col justify-between">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100" />
        <div className="h-8 w-8 animate-pulse rounded-full bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100" />
      </div>
    </div>
  );
}
