import { ORDER_TRANSITIONS } from "@/lib/constants";
import {
  calculateServiceEstimate,
  getServiceLoadCapacityKg,
  normalizePricingService,
  type PricingOptionGroup,
} from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { bookOrderSchema, updateOrderStatusSchema } from "@/lib/validators/order";
import { applyVoucher, createMockPaymentIntent } from "@/services/checkout";
import { logOrderEvent } from "@/services/notifications";
import type { OrderStatus, UserRole } from "@/types/domain";

type SelectedServiceRecord = {
  id: string;
  shop_id: string;
  name: string;
  description: string | null;
  pricing_model: "per_kg" | "per_load";
  unit_price: number;
  load_capacity_kg: number | null;
  service_option_groups?: PricingOptionGroup[] | null;
};

export async function createOrder(input: unknown) {
  const parsed = bookOrderSchema.parse(input);
  const pickupTimestamp = Date.parse(parsed.pickupDate);
  const deliveryTimestamp = parsed.deliveryDate ? Date.parse(parsed.deliveryDate) : null;

  if (parsed.deliveryDate && (Number.isNaN(pickupTimestamp) || Number.isNaN(deliveryTimestamp ?? Number.NaN) || (deliveryTimestamp ?? 0) < pickupTimestamp)) {
    throw new Error("Invalid delivery schedule");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: UserRole }>();

  if (profile?.role !== "customer") throw new Error("Unauthorized");

  const requestedSelections = parsed.serviceSelections.length > 0
    ? parsed.serviceSelections
    : [{ serviceId: parsed.serviceId, loads: 1, selectedOptionIds: parsed.selectedOptionIds }];
  const requestedServiceIds = requestedSelections.map((selection) => selection.serviceId);

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select(
      "id, shop_id, name, description, pricing_model, unit_price, load_capacity_kg, service_option_groups(id, name, option_type, selection_type, is_required, sort_order, service_options(id, name, description, price_delta, price_type, is_default, sort_order))",
    )
    .in("id", requestedServiceIds);

  if (servicesError || !services || services.length !== requestedServiceIds.length) {
    throw new Error("Invalid service selected");
  }

  const servicesById = new Map(
    services.map((service) => [service.id, service as SelectedServiceRecord]),
  );

  const { data: shop, error: shopError } = await supabase
    .from("laundry_shops")
    .select("shop_name, load_capacity_kg")
    .eq("id", parsed.shopId)
    .single();

  if (shopError || !shop) {
    throw new Error("Laundry shop not found");
  }

  const estimatedServices = requestedSelections.map((selection) => {
    const service = servicesById.get(selection.serviceId);

    if (!service || service.shop_id !== parsed.shopId) {
      throw new Error("Invalid service selected");
    }

    const normalizedService = normalizePricingService(service);
    const loadCapacityKg = getServiceLoadCapacityKg(normalizedService, shop.load_capacity_kg);
    const weightKg = Number((selection.loads * loadCapacityKg).toFixed(1));
    const estimate = calculateServiceEstimate({
      service: normalizedService,
      weightKg,
      selectedOptionIds: selection.selectedOptionIds,
      shopLoadCapacityKg: shop.load_capacity_kg,
    });

    return {
      serviceId: service.id,
      service: normalizedService,
      loads: selection.loads,
      weightKg,
      estimate,
    };
  });

  const primarySelection = estimatedServices.find((entry) => entry.serviceId === parsed.serviceId) ?? estimatedServices[0];
  const subtotal = Number(estimatedServices.reduce((sum, entry) => sum + entry.estimate.subtotal, 0).toFixed(2));
  const totalWeight = Number(estimatedServices.reduce((sum, entry) => sum + entry.weightKg, 0).toFixed(1));
  const totalBasePrice = Number(estimatedServices.reduce((sum, entry) => sum + entry.estimate.basePrice, 0).toFixed(2));
  const totalOptionsPrice = Number(estimatedServices.reduce((sum, entry) => sum + entry.estimate.optionsTotal, 0).toFixed(2));
  const totalLoads = estimatedServices.reduce((sum, entry) => sum + entry.loads, 0);
  const allSelectedOptionIds = estimatedServices.flatMap((entry) => entry.estimate.selectedOptions.map((option) => option.id));
  const { promoCode, discount } = await applyVoucher(parsed.promoCode, subtotal);
  const total = subtotal + parsed.deliveryFee + parsed.tipAmount - discount;
  const paymentIntent = await createMockPaymentIntent(total, parsed.paymentMethod);

  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      shop_id: parsed.shopId,
      service_id: primarySelection.serviceId,
      weight_estimate: totalWeight,
      selected_option_ids: allSelectedOptionIds,
      service_snapshot: {
        name: primarySelection.service.name,
        description: primarySelection.service.description,
        pricingModel: primarySelection.service.pricing_model,
        unitPrice: primarySelection.service.unit_price,
        loadCapacityKg: primarySelection.estimate.loadCapacityKg,
        shopName: shop.shop_name,
        selectedOptions: primarySelection.estimate.selectedOptions.map((option) => ({
          id: option.id,
          name: option.name,
          optionType: option.option_type,
          groupName: option.group_name,
          priceDelta: option.price_delta,
          priceType: option.price_type,
        })),
        items: estimatedServices.map((entry) => ({
          serviceId: entry.serviceId,
          name: entry.service.name,
          description: entry.service.description,
          pricingModel: entry.service.pricing_model,
          unitPrice: entry.service.unit_price,
          loadCapacityKg: entry.estimate.loadCapacityKg,
          loads: entry.loads,
          weightKg: entry.weightKg,
          selectedOptions: entry.estimate.selectedOptions.map((option) => ({
            id: option.id,
            name: option.name,
            optionType: option.option_type,
            groupName: option.group_name,
            priceDelta: option.price_delta,
            priceType: option.price_type,
          })),
          subtotal: entry.estimate.subtotal,
        })),
      },
      pricing_breakdown: {
        basePrice: totalBasePrice,
        optionsTotal: totalOptionsPrice,
        loadCount: totalLoads,
        loadCapacityKg: primarySelection.estimate.loadCapacityKg,
        subtotal,
        deliveryFee: parsed.deliveryFee,
        tipAmount: parsed.tipAmount,
        discountAmount: discount,
        total,
        items: estimatedServices.map((entry) => ({
          serviceId: entry.serviceId,
          basePrice: entry.estimate.basePrice,
          optionsTotal: entry.estimate.optionsTotal,
          loadCount: entry.estimate.loadCount,
          loadCapacityKg: entry.estimate.loadCapacityKg,
          subtotal: entry.estimate.subtotal,
          selectedOptionIds: entry.estimate.selectedOptions.map((option) => option.id),
        })),
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
    loadCount: totalLoads,
    serviceSubtotal: subtotal,
    optionsTotal: totalOptionsPrice,
    selectedOptions: estimatedServices.flatMap((entry) => entry.estimate.selectedOptions.map((option) => option.name)),
    selectedServices: estimatedServices.map((entry) => ({
      name: entry.service.name,
      loads: entry.loads,
      subtotal: entry.estimate.subtotal,
    })),
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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, total_price, pickup_date, created_at, payment_method, payment_reference, promo_code, discount_amount, distance_km, eta_minutes, laundry_shops(shop_name)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getMyOrderTrackingDetails(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, customer_id, shop_id, service_id, status, pickup_date, delivery_date, total_price, payment_method, payment_reference, promo_code, discount_amount, tip_amount, delivery_fee, distance_km, eta_minutes, dropoff_address, pickup_address, created_at, laundry_shops(shop_name, location), services(name)",
    )
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (orderError) {
    throw orderError;
  }

  if (!order) {
    return null;
  }

  const { data: delivery } = await supabase
    .from("deliveries")
    .select("status, eta_minutes, rider_id, assigned_at")
    .eq("order_id", order.id)
    .maybeSingle();

  const { data: riderLocation } = await supabase
    .from("rider_locations")
    .select("lat, lng, updated_at")
    .eq("order_id", order.id)
    .maybeSingle();

  let riderName: string | null = null;
  let riderPhone: string | null = null;

  if (delivery?.rider_id) {
    const { data: rider } = await supabase
      .from("riders")
      .select("profile_id")
      .eq("id", delivery.rider_id)
      .maybeSingle();

    if (rider?.profile_id) {
      const { data: riderProfile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", rider.profile_id)
        .maybeSingle();

      riderName = riderProfile?.full_name ?? null;
      riderPhone = riderProfile?.phone ?? null;
    }
  }

  const shop = Array.isArray(order.laundry_shops) ? order.laundry_shops[0] : order.laundry_shops;
  const service = Array.isArray(order.services) ? order.services[0] : order.services;

  return {
    order: {
      id: order.id,
      shopId: order.shop_id,
      serviceId: order.service_id,
      status: order.status,
      pickupDate: order.pickup_date,
      deliveryDate: order.delivery_date,
      totalPrice: order.total_price,
      paymentMethod: order.payment_method,
      paymentReference: order.payment_reference,
      promoCode: order.promo_code,
      discountAmount: order.discount_amount,
      tipAmount: order.tip_amount,
      deliveryFee: order.delivery_fee,
      distanceKm: order.distance_km,
      etaMinutes: order.eta_minutes,
      pickupAddress: order.pickup_address,
      dropoffAddress: order.dropoff_address,
      createdAt: order.created_at,
      shopName: shop?.shop_name ?? "Laundry Shop",
      shopLocation: shop?.location ?? "",
      serviceName: service?.name ?? "Wash",
    },
    delivery: {
      status: delivery?.status ?? null,
      etaMinutes: delivery?.eta_minutes ?? null,
      assignedAt: delivery?.assigned_at ?? null,
      riderName,
      riderPhone,
    },
    riderLocation: riderLocation
      ? {
          lat: riderLocation.lat,
          lng: riderLocation.lng,
          updatedAt: riderLocation.updated_at,
        }
      : null,
  };
}
