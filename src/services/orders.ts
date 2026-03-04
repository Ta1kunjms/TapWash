import { ORDER_TRANSITIONS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { bookOrderSchema, updateOrderStatusSchema } from "@/lib/validators/order";
import { applyVoucher, createMockPaymentIntent } from "@/services/checkout";
import { logOrderEvent } from "@/services/notifications";
import type { OrderStatus } from "@/types/domain";

export async function createOrder(input: unknown) {
  const parsed = bookOrderSchema.parse(input);
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Unauthorized");

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("price_per_kg, shop_id")
    .eq("id", parsed.serviceId)
    .single();

  if (serviceError || !service || service.shop_id !== parsed.shopId) {
    throw new Error("Invalid service selected");
  }

  const subtotal = service.price_per_kg * parsed.weightEstimate;
  const { promoCode, discount } = await applyVoucher(parsed.promoCode, subtotal);
  const total = subtotal + parsed.deliveryFee - discount;
  const paymentIntent = await createMockPaymentIntent(total, parsed.paymentMethod);

  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      shop_id: parsed.shopId,
      service_id: parsed.serviceId,
      weight_estimate: parsed.weightEstimate,
      total_price: total,
      delivery_fee: parsed.deliveryFee,
      discount_amount: discount,
      status: "pending",
      pickup_date: parsed.pickupDate,
      pickup_address: parsed.pickupAddress,
      dropoff_address: parsed.dropoffAddress,
      pickup_lat: parsed.pickupLat ?? null,
      pickup_lng: parsed.pickupLng ?? null,
      dropoff_lat: parsed.dropoffLat ?? null,
      dropoff_lng: parsed.dropoffLng ?? null,
      distance_km: parsed.distanceKm ?? null,
      eta_minutes: parsed.etaMinutes ?? null,
      promo_code: promoCode,
      payment_status: "unpaid",
      payment_method: parsed.paymentMethod,
      payment_reference: paymentIntent?.reference ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  await logOrderEvent(data.id, "order_created", {
    promoCode,
    discount,
    paymentMethod: parsed.paymentMethod,
    paymentReference: paymentIntent?.reference ?? null,
  });
  return data;
}

export async function updateOrderStatus(input: unknown) {
  const parsed = updateOrderStatusSchema.parse(input);
  const supabase = await createClient();

  const { data: currentOrder, error: getError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", parsed.orderId)
    .single();

  if (getError || !currentOrder) throw new Error("Order not found");

  const allowed = ORDER_TRANSITIONS[currentOrder.status as OrderStatus];
  if (!allowed.includes(parsed.nextStatus as OrderStatus)) {
    throw new Error("Invalid order transition");
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: parsed.nextStatus })
    .eq("id", parsed.orderId);

  if (error) throw error;
  await logOrderEvent(parsed.orderId, "order_status_updated", {
    from: currentOrder.status,
    to: parsed.nextStatus,
  });
}

export async function getMyOrders() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total_price, pickup_date, created_at, payment_method, payment_reference, promo_code, discount_amount, distance_km, eta_minutes, laundry_shops(shop_name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
