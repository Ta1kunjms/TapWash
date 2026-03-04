import { createClient } from "@/lib/supabase/server";
import { logOrderEvent } from "@/services/notifications";

export async function listAvailableRiders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("riders")
    .select("id, profile_id, is_available")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function listShopDispatchOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, pickup_date, dropoff_address, dropoff_lat, dropoff_lng")
    .in("status", ["ready", "out_for_delivery"])
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) throw error;
  return data;
}

export async function assignRider(orderId: string, riderId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("deliveries").upsert(
    {
      order_id: orderId,
      rider_id: riderId,
      status: "assigned",
      eta_minutes: 45,
    },
    { onConflict: "order_id" },
  );

  if (error) throw error;

  const { error: orderError } = await supabase
    .from("orders")
    .update({ status: "out_for_delivery" })
    .eq("id", orderId);

  if (orderError) throw orderError;

  await logOrderEvent(orderId, "rider_assigned", { riderId });
}

export async function updateDeliveryStatus(orderId: string, status: "picked_up" | "in_transit" | "delivered" | "failed" | "cancelled") {
  const supabase = await createClient();
  const patch: {
    status: string;
    picked_at?: string;
    delivered_at?: string;
  } = {
    status,
  };

  if (status === "picked_up") patch.picked_at = new Date().toISOString();
  if (status === "delivered") patch.delivered_at = new Date().toISOString();

  const { data: delivery, error } = await supabase
    .from("deliveries")
    .update(patch)
    .eq("order_id", orderId)
    .select("id, rider_id")
    .single();

  if (error) throw error;

  if (status === "delivered") {
    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId);
    if (orderError) throw orderError;
  }

  if ((status === "delivered" || status === "failed" || status === "cancelled") && delivery?.rider_id) {
    await supabase.from("riders").update({ is_available: true }).eq("id", delivery.rider_id);
  }

  await logOrderEvent(orderId, "delivery_status_updated", { status });
}

export async function updateRiderLocation(input: {
  orderId: string;
  riderId: string;
  lat: number;
  lng: number;
  heading?: number;
  speedKph?: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("rider_locations").upsert(
    {
      order_id: input.orderId,
      rider_id: input.riderId,
      lat: input.lat,
      lng: input.lng,
      heading: input.heading ?? null,
      speed_kph: input.speedKph ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "order_id" },
  );

  if (error) throw error;

  await logOrderEvent(input.orderId, "rider_location_updated", {
    lat: input.lat,
    lng: input.lng,
  });
}

export async function listVouchers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vouchers")
    .select("id, code, description, discount_type, discount_value, is_active, min_order_amount")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createVoucher(input: {
  code: string;
  description: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  minOrderAmount: number;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("vouchers").insert({
    code: input.code.toUpperCase(),
    description: input.description,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    min_order_amount: input.minOrderAmount,
    is_active: true,
  });

  if (error) throw error;
}

export async function toggleVoucher(voucherId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vouchers")
    .update({ is_active: isActive })
    .eq("id", voucherId);

  if (error) throw error;
}
