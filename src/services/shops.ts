import { createClient } from "@/lib/supabase/server";

type FeedQueryInput = {
  search?: string;
  page: number;
  limit: number;
};

type FeedQueryResult = {
  rows: Array<{
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
    services?: Array<{ name: string | null }> | null;
  }>;
  total: number;
  hasMore: boolean;
};

type FeedSourceQueryResult = {
  rows: FeedQueryResult["rows"];
  total: number;
};

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

export async function getVerifiedShopsWithServices(
  search?: string,
  options?: { shopId?: string; limit?: number },
) {
  const supabase = await createClient();
  const limit = Math.min(120, Math.max(1, options?.limit ?? 40));
  const fullSelect =
    "id, shop_name, description, location, cover_image_url, starting_price, load_capacity_kg, city_id, rating_avg, total_reviews, promo_badge, eta_min, eta_max, lat, lng, services(id, name, description, pricing_model, unit_price, load_capacity_kg, service_option_groups(id, name, option_type, selection_type, is_required, sort_order, service_options(id, name, description, price_delta, price_type, is_default, sort_order)))";

  let fullQuery = supabase
    .from("laundry_shops")
    .select(fullSelect)
    .eq("is_verified", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.shopId) {
    fullQuery = fullQuery.eq("id", options.shopId);
  }

  if (search) {
    fullQuery = fullQuery.or(`shop_name.ilike.%${search}%,location.ilike.%${search}%`);
  }

  const { data: fullData, error: fullError } = await fullQuery;
  if (!fullError) {
    return fullData;
  }

  // Timeout/cancelled queries can happen when nested service options are large.
  // Retry with a lightweight projection so customer flows remain functional.
  if ((fullError as { code?: string }).code === "57014") {
    let lightQuery = supabase
      .from("laundry_shops")
      .select(
        "id, shop_name, description, location, cover_image_url, starting_price, load_capacity_kg, city_id, rating_avg, total_reviews, promo_badge, eta_min, eta_max, lat, lng, services(id, name, description, pricing_model, unit_price, load_capacity_kg)",
      )
      .eq("is_verified", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (options?.shopId) {
      lightQuery = lightQuery.eq("id", options.shopId);
    }

    if (search) {
      lightQuery = lightQuery.or(`shop_name.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data: lightData, error: lightError } = await lightQuery;
    if (lightError) {
      throw lightError;
    }

    return lightData;
  }

  throw fullError;
}

export async function getVerifiedShopsFeedPage(input: FeedQueryInput): Promise<FeedQueryResult> {
  const supabase = await createClient();
  const page = Math.max(1, input.page);
  const limit = Math.min(40, Math.max(6, input.limit));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("laundry_shops")
    .select(
      "id, shop_name, description, location, cover_image_url, starting_price, load_capacity_kg, rating_avg, total_reviews, promo_badge, eta_min, eta_max, lat, lng, services(name)",
      { count: "planned" },
    )
    .eq("is_verified", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (input.search) {
    query = query.or(`shop_name.ilike.%${input.search}%,location.ilike.%${input.search}%`);
  }

  const { data, error, count } = await query;
  if (!error) {
    const total = count ?? data?.length ?? 0;
    const rows = (data ?? []) as FeedQueryResult["rows"];

    return {
      rows,
      total,
      hasMore: from + rows.length < total,
    };
  }

  if ((error as { code?: string }).code === "57014") {
    let fallbackQuery = supabase
      .from("laundry_shops")
      .select(
        "id, shop_name, description, location, cover_image_url, starting_price, load_capacity_kg, rating_avg, total_reviews, promo_badge, eta_min, eta_max, lat, lng",
      )
      .eq("is_verified", true)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (input.search) {
      fallbackQuery = fallbackQuery.or(`shop_name.ilike.%${input.search}%,location.ilike.%${input.search}%`);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;
    if (fallbackError) {
      throw fallbackError;
    }

    const rows = ((fallbackData ?? []) as Array<Record<string, unknown>>).map((entry) => ({
      ...(entry as Omit<FeedQueryResult["rows"][number], "services">),
      services: [],
    }));

    return {
      rows,
      total: from + rows.length,
      hasMore: rows.length === limit,
    };
  }

  throw error;
}

export async function getVerifiedShopsFeedSource(
  search?: string,
  options?: { limit?: number },
): Promise<FeedSourceQueryResult> {
  const supabase = await createClient();
  const limit = Math.min(500, Math.max(50, options?.limit ?? 300));

  let query = supabase
    .from("laundry_shops")
    .select(
      "id, shop_name, description, location, cover_image_url, starting_price, load_capacity_kg, rating_avg, total_reviews, promo_badge, eta_min, eta_max, lat, lng, services(name)",
      { count: "planned" },
    )
    .eq("is_verified", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (search) {
    query = query.or(`shop_name.ilike.%${search}%,location.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (!error) {
    return {
      rows: (data ?? []) as FeedQueryResult["rows"],
      total: count ?? data?.length ?? 0,
    };
  }

  if ((error as { code?: string }).code === "57014") {
    let fallbackQuery = supabase
      .from("laundry_shops")
      .select(
        "id, shop_name, description, location, cover_image_url, starting_price, load_capacity_kg, rating_avg, total_reviews, promo_badge, eta_min, eta_max, lat, lng",
      )
      .eq("is_verified", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (search) {
      fallbackQuery = fallbackQuery.or(`shop_name.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;
    if (fallbackError) {
      throw fallbackError;
    }

    const rows = ((fallbackData ?? []) as Array<Record<string, unknown>>).map((entry) => ({
      ...(entry as Omit<FeedQueryResult["rows"][number], "services">),
      services: [],
    }));

    return {
      rows,
      total: rows.length,
    };
  }

  throw error;
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
      "id, shop_name, description, location, cover_image_url, starting_price, load_capacity_kg, is_verified, city_id, rating_avg, total_reviews, promo_badge, eta_min, eta_max, lat, lng, services(id, name, description, pricing_model, unit_price, load_capacity_kg, service_option_groups(id, name, option_type, selection_type, is_required, sort_order, service_options(id, name, description, price_delta, price_type, is_default, sort_order)))",
    )
    .eq("is_verified", true)
    .eq("id", shopId)
    .maybeSingle();

  if (!error) {
    return data;
  }

  if ((error as { code?: string }).code === "57014") {
    const { data: lightData, error: lightError } = await supabase
      .from("laundry_shops")
      .select(
        "id, shop_name, description, location, cover_image_url, starting_price, load_capacity_kg, is_verified, city_id, rating_avg, total_reviews, promo_badge, eta_min, eta_max, lat, lng, services(id, name, description, pricing_model, unit_price, load_capacity_kg)",
      )
      .eq("is_verified", true)
      .eq("id", shopId)
      .maybeSingle();

    if (lightError) throw lightError;
    return lightData;
  }

  throw error;
}
