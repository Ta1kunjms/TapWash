import { createClient } from "@/lib/supabase/server";

export async function getVerifiedShops() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("laundry_shops")
    .select("id, shop_name, description, location, price_per_kg, is_verified, rating_avg, total_reviews, promo_badge, eta_min, eta_max")
    .eq("is_verified", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getVerifiedShopsWithServices(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("laundry_shops")
    .select(
      "id, shop_name, description, location, price_per_kg, city_id, rating_avg, total_reviews, promo_badge, eta_min, eta_max, services(id, name, price_per_kg)",
    )
    .eq("is_verified", true)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`shop_name.ilike.%${search}%,location.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getShopServices(shopId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, price_per_kg")
    .eq("shop_id", shopId)
    .order("name");

  if (error) throw error;
  return data;
}
