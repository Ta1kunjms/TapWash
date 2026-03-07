import { createClient } from "@/lib/supabase/server";

export async function getVerifiedShops(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("laundry_shops")
    .select("id, shop_name, description, location, cover_image_url, starting_price, load_capacity_kg, is_verified, rating_avg, total_reviews, promo_badge, eta_min, eta_max, lat, lng")
    .eq("is_verified", true)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`shop_name.ilike.%${search}%,location.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getVerifiedShopsWithServices(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("laundry_shops")
    .select(
      "id, shop_name, description, location, cover_image_url, starting_price, load_capacity_kg, city_id, rating_avg, total_reviews, promo_badge, eta_min, eta_max, lat, lng, services(id, name, description, pricing_model, unit_price, load_capacity_kg, service_option_groups(id, name, option_type, selection_type, is_required, sort_order, service_options(id, name, description, price_delta, price_type, is_default, sort_order)))",
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
    .select(
      "id, name, description, pricing_model, unit_price, load_capacity_kg, service_option_groups(id, name, option_type, selection_type, is_required, sort_order, service_options(id, name, description, price_delta, price_type, is_default, sort_order))",
    )
    .eq("shop_id", shopId)
    .order("name");

  if (error) throw error;
  return data;
}

export async function getVerifiedShopByIdWithServices(shopId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("laundry_shops")
    .select(
      "id, shop_name, description, location, cover_image_url, starting_price, load_capacity_kg, city_id, rating_avg, total_reviews, promo_badge, eta_min, eta_max, lat, lng, services(id, name, description, pricing_model, unit_price, load_capacity_kg, service_option_groups(id, name, option_type, selection_type, is_required, sort_order, service_options(id, name, description, price_delta, price_type, is_default, sort_order)))",
    )
    .eq("is_verified", true)
    .eq("id", shopId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
