import { haversineDistanceKm } from "@/lib/delivery-quote";
import { getVerifiedShopsFeedPage } from "@/services/shops";
import { NextResponse } from "next/server";

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

type FeedShop = {
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
  lat: number | null;
  lng: number | null;
  distance_km: number | null;
  service_names: string[];
  status: "open" | "low_capacity" | "closing_soon" | "busy" | "closed";
  status_label: string;
  social_proof: string;
  trust_badges: string[];
};

type FeedResponse = {
  items: FeedShop[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

const ALLOWED_SORTS = new Set<SortMode>([
  "alphabetical_asc",
  "alphabetical_desc",
  "rating_desc",
  "reviews_desc",
  "nearest",
  "eta_asc",
  "price_asc",
  "discount_desc",
  "open_now",
]);

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSort(value: string | null): SortMode {
  if (!value) return "rating_desc";
  return ALLOWED_SORTS.has(value as SortMode) ? (value as SortMode) : "rating_desc";
}

function includesService(serviceNames: string[], selected: string[]): boolean {
  if (selected.length === 0) return true;
  const lowered = serviceNames.join(" ").toLowerCase();

  return selected.every((service) => {
    if (service === "wash_fold") return lowered.includes("wash") || lowered.includes("fold");
    if (service === "dry_cleaning") return lowered.includes("dry");
    if (service === "ironing") return lowered.includes("iron") || lowered.includes("press");
    if (service === "premium") return lowered.includes("premium") || lowered.includes("delicate");
    return false;
  });
}

function getOpenNow(): boolean {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 21;
}

function computeStatus(shop: {
  eta_max: number | null;
  load_capacity_kg: number;
  rating_avg: number | null;
  total_reviews: number | null;
}): { status: FeedShop["status"]; label: string } {
  const hour = new Date().getHours();
  const isOpen = getOpenNow();

  if (!isOpen) return { status: "closed", label: "Closed" };
  if (hour >= 19) return { status: "closing_soon", label: "Closing Soon" };
  if (shop.load_capacity_kg <= 6) return { status: "low_capacity", label: "Low Capacity" };
  if ((shop.rating_avg ?? 0) >= 4.7 && (shop.total_reviews ?? 0) >= 80) return { status: "busy", label: "Busy" };
  if ((shop.eta_max ?? 90) <= 45) return { status: "open", label: "Fast Service" };

  return { status: "open", label: "Open" };
}

function compareBy(sort: SortMode, a: FeedShop, b: FeedShop): number {
  if (sort === "alphabetical_asc") return a.shop_name.localeCompare(b.shop_name);
  if (sort === "alphabetical_desc") return b.shop_name.localeCompare(a.shop_name);
  if (sort === "rating_desc") return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
  if (sort === "reviews_desc") return (b.total_reviews ?? 0) - (a.total_reviews ?? 0);
  if (sort === "eta_asc") return (a.eta_max ?? Number.POSITIVE_INFINITY) - (b.eta_max ?? Number.POSITIVE_INFINITY);
  if (sort === "price_asc") return a.starting_price - b.starting_price;
  if (sort === "discount_desc") return Number(Boolean(b.promo_badge)) - Number(Boolean(a.promo_badge));
  if (sort === "open_now") {
    const aOpen = Number(a.status !== "closed");
    const bOpen = Number(b.status !== "closed");
    if (aOpen !== bOpen) return bOpen - aOpen;
    return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
  }

  if (a.distance_km === null && b.distance_km === null) return 0;
  if (a.distance_km === null) return 1;
  if (b.distance_km === null) return -1;
  return a.distance_km - b.distance_km;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(20, Math.max(6, Number(url.searchParams.get("limit") ?? "8")));
    const sort = parseSort(url.searchParams.get("sort"));
    const userLat = parseNumber(url.searchParams.get("userLat"));
    const userLng = parseNumber(url.searchParams.get("userLng"));

    const minRating = parseNumber(url.searchParams.get("minRating"));
    const minPrice = parseNumber(url.searchParams.get("minPrice"));
    const maxPrice = parseNumber(url.searchParams.get("maxPrice"));

    const openNowOnly = url.searchParams.get("openNow") === "1";
    const freePickupOnly = url.searchParams.get("freePickup") === "1";
    const sameDayOnly = url.searchParams.get("sameDay") === "1";
    const expressOnly = url.searchParams.get("express") === "1";
    const verifiedOnly = url.searchParams.get("verified") !== "0";
    const promoOnly = url.searchParams.get("promo") === "1";

    const serviceFilterValues = (url.searchParams.get("services") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const { rows: shops, total: sourceTotal, hasMore: sourceHasMore } = await getVerifiedShopsFeedPage({
      search: q || undefined,
      page,
      limit,
    });
    const openNow = getOpenNow();

    const normalized: FeedShop[] = shops.map((shop) => {
      const canComputeDistance =
        typeof userLat === "number" &&
        typeof userLng === "number" &&
        typeof shop.lat === "number" &&
        typeof shop.lng === "number";

      const distance = canComputeDistance
        ? Number(
            haversineDistanceKm(
              { lat: userLat, lng: userLng },
              { lat: shop.lat as number, lng: shop.lng as number },
            ).toFixed(1),
          )
        : null;

      const serviceNames = Array.isArray(shop.services)
        ? shop.services
            .filter((service) => typeof service?.name === "string")
        .map((service) => service.name as string)
        : [];

      const status = computeStatus({
        eta_max: shop.eta_max,
        load_capacity_kg: Number(shop.load_capacity_kg ?? 0),
        rating_avg: shop.rating_avg,
        total_reviews: shop.total_reviews,
      });

      const trustBadges = [
        shop.rating_avg !== null && shop.rating_avg >= 4.7 ? "Top Rated" : null,
        (shop.eta_max ?? 120) <= 60 ? "Fast Response" : null,
        verifiedOnly ? "Verified" : null,
      ].filter((value): value is string => Boolean(value));

      const weeklyBookings = Math.max(12, Math.round((shop.total_reviews ?? 0) * 0.9));

      return {
        id: shop.id,
        shop_name: shop.shop_name,
        description: shop.description,
        location: shop.location,
        cover_image_url: shop.cover_image_url,
        starting_price: Number(shop.starting_price ?? 0),
        load_capacity_kg: Number(shop.load_capacity_kg ?? 0),
        rating_avg: shop.rating_avg,
        total_reviews: shop.total_reviews,
        promo_badge: shop.promo_badge,
        eta_min: shop.eta_min,
        eta_max: shop.eta_max,
        lat: shop.lat,
        lng: shop.lng,
        distance_km: distance,
        service_names: serviceNames,
        status: status.status,
        status_label: status.label,
        social_proof: `Booked ${weeklyBookings} times this week`,
        trust_badges: trustBadges,
      };
    });

    const filtered = normalized.filter((shop) => {
      if (verifiedOnly && shop.trust_badges.includes("Verified") === false) return false;
      if (openNowOnly && (shop.status === "closed" || !openNow)) return false;
      if (minRating !== null && (shop.rating_avg ?? 0) < minRating) return false;
      if (minPrice !== null && shop.starting_price < minPrice) return false;
      if (maxPrice !== null && shop.starting_price > maxPrice) return false;
      if (promoOnly && !shop.promo_badge) return false;

      if (freePickupOnly) {
        const freePickupSignals = `${shop.promo_badge ?? ""} ${shop.description ?? ""}`.toLowerCase();
        if (!freePickupSignals.includes("free pickup")) return false;
      }

      if (sameDayOnly && (shop.eta_max ?? 24 * 60) > 8 * 60) return false;
      if (expressOnly && (shop.eta_max ?? Number.POSITIVE_INFINITY) > 180) return false;
      if (!includesService(shop.service_names, serviceFilterValues)) return false;

      return true;
    });

    const sorted = filtered.sort((a, b) => compareBy(sort, a, b));
    const items = sorted.slice(0, limit);

    const payload: FeedResponse = {
      items,
      page,
      limit,
      total: sourceTotal,
      hasMore: sourceHasMore,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error loading customer shops feed:", error);
    return NextResponse.json({ error: "Could not load laundromats right now." }, { status: 500 });
  }
}
