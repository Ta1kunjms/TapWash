import { haversineDistanceKm } from "@/lib/delivery-quote";
import { createClient } from "@/lib/supabase/server";

type FavoriteShopRow = {
  id: string;
  shop_name: string;
  description: string | null;
  location: string;
  starting_price: number;
  load_capacity_kg: number;
  rating_avg: number | null;
  total_reviews: number | null;
  promo_badge: string | null;
  eta_min: number | null;
  eta_max: number | null;
  lat: number | null;
  lng: number | null;
};

export async function listFavoriteShopIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("customer_favorites")
    .select("shop_id")
    .eq("customer_id", user.id);

  if (error) throw error;
  return (data ?? []).map((entry) => entry.shop_id);
}

export async function toggleShopFavorite(shopId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: existing, error: findError } = await supabase
    .from("customer_favorites")
    .select("id")
    .eq("customer_id", user.id)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (findError) throw findError;

  if (existing) {
    const { error: deleteError } = await supabase.from("customer_favorites").delete().eq("id", existing.id);
    if (deleteError) throw deleteError;
    return false;
  }

  const { error: insertError } = await supabase.from("customer_favorites").insert({
    customer_id: user.id,
    shop_id: shopId,
  });

  if (insertError) throw insertError;
  return true;
}

export async function getFavoriteShops(input?: {
  search?: string;
  preferredLat?: number | null;
  preferredLng?: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from("customer_favorites")
    .select(
      "shop_id, laundry_shops(id, shop_name, description, location, starting_price, load_capacity_kg, rating_avg, total_reviews, promo_badge, eta_min, eta_max, lat, lng)",
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const trimmedSearch = input?.search?.trim();
  if (trimmedSearch) {
    query = query.or(`shop_name.ilike.%${trimmedSearch}%,location.ilike.%${trimmedSearch}%`, {
      foreignTable: "laundry_shops",
    });
  }

  const { data, error } = await query;
  if (error) throw error;

  const shops: Array<FavoriteShopRow & { distance_km: number | null }> = (data ?? [])
    .map((row) => {
      const value = row.laundry_shops;
      if (!value || Array.isArray(value)) return null;
      return value as FavoriteShopRow;
    })
    .filter((row): row is FavoriteShopRow => Boolean(row))
    .map((shop) => {
      const canComputeDistance =
        typeof input?.preferredLat === "number" &&
        typeof input?.preferredLng === "number" &&
        typeof shop.lat === "number" &&
        typeof shop.lng === "number";

      const distance_km = canComputeDistance
        ? Number(haversineDistanceKm({ lat: input.preferredLat as number, lng: input.preferredLng as number }, { lat: shop.lat as number, lng: shop.lng as number }).toFixed(1))
        : null;

      return {
        ...shop,
        distance_km,
      };
    });

  return shops.sort((a, b) => {
    if (a.distance_km === null && b.distance_km === null) return 0;
    if (a.distance_km === null) return 1;
    if (b.distance_km === null) return -1;
    return a.distance_km - b.distance_km;
  });
}
