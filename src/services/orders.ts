import { ORDER_TRANSITIONS } from "@/lib/constants";
import { calculateServiceEstimate, normalizePricingService } from "@/lib/pricing";
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
    .select(
      "shop_id, name, description, pricing_model, unit_price, load_capacity_kg, service_option_groups(id, name, option_type, selection_type, is_required, sort_order, service_options(id, name, description, price_delta, price_type, is_default, sort_order))",
    )
    .eq("id", parsed.serviceId)
    .single();

  if (serviceError || !service || service.shop_id !== parsed.shopId) {
    throw new Error("Invalid service selected");
  }

  const { data: shop, error: shopError } = await supabase
    .from("laundry_shops")
    .select("shop_name, load_capacity_kg")
    .eq("id", parsed.shopId)
    .single();

  if (shopError || !shop) {
    throw new Error("Laundry shop not found");
  }

  const normalizedService = normalizePricingService(service);
  const estimate = calculateServiceEstimate({
    service: normalizedService,
    weightKg: parsed.weightEstimate,
    selectedOptionIds: parsed.selectedOptionIds,
    shopLoadCapacityKg: shop.load_capacity_kg,
  });
  const subtotal = estimate.subtotal;
  const { promoCode, discount } = await applyVoucher(parsed.promoCode, subtotal);
  const total = subtotal + parsed.deliveryFee + parsed.tipAmount - discount;
  const paymentIntent = await createMockPaymentIntent(total, parsed.paymentMethod);

  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      shop_id: parsed.shopId,
      service_id: parsed.serviceId,
      weight_estimate: parsed.weightEstimate,
      selected_option_ids: estimate.selectedOptions.map((option) => option.id),
      service_snapshot: {
        name: normalizedService.name,
        description: normalizedService.description,
        pricingModel: normalizedService.pricing_model,
        unitPrice: normalizedService.unit_price,
        loadCapacityKg: estimate.loadCapacityKg,
        shopName: shop.shop_name,
        selectedOptions: estimate.selectedOptions.map((option) => ({
          id: option.id,
          name: option.name,
          optionType: option.option_type,
          groupName: option.group_name,
          priceDelta: option.price_delta,
          priceType: option.price_type,
        })),
      },
      pricing_breakdown: {
        basePrice: estimate.basePrice,
        optionsTotal: estimate.optionsTotal,
        loadCount: estimate.loadCount,
        loadCapacityKg: estimate.loadCapacityKg,
        subtotal,
        deliveryFee: parsed.deliveryFee,
        tipAmount: parsed.tipAmount,
        discountAmount: discount,
        total,
      },
      total_price: total,
      delivery_fee: parsed.deliveryFee,
      discount_amount: discount,
      status: "pending",
      pickup_date: parsed.pickupDate,
      delivery_date: parsed.deliveryDate ?? null,
      pickup_address: parsed.pickupAddress,
      dropoff_address: parsed.dropoffAddress,
      contact_phone: parsed.contactPhone,
      delivery_instructions: parsed.deliveryInstructions || null,
      rider_notes: parsed.riderNotes || null,
      pickup_lat: parsed.pickupLat ?? null,
      pickup_lng: parsed.pickupLng ?? null,
      dropoff_lat: parsed.dropoffLat ?? null,
      dropoff_lng: parsed.dropoffLng ?? null,
      distance_km: parsed.distanceKm ?? null,
      eta_minutes: parsed.etaMinutes ?? null,
      promo_code: promoCode,
      tip_amount: parsed.tipAmount,
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
    loadCount: estimate.loadCount,
    serviceSubtotal: subtotal,
    optionsTotal: estimate.optionsTotal,
    selectedOptions: estimate.selectedOptions.map((option) => option.name),
    tipAmount: parsed.tipAmount,
    contactPhone: parsed.contactPhone,
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
