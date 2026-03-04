"use server";

import { createOrder, updateOrderStatus } from "@/services/orders";
import { revalidatePath } from "next/cache";

export async function createOrderAction(formData: FormData) {
  await createOrder({
    shopId: String(formData.get("shopId")),
    serviceId: String(formData.get("serviceId")),
    weightEstimate: Number(formData.get("weightEstimate")),
    pickupDate: new Date(String(formData.get("pickupDate"))).toISOString(),
    deliveryFee: Number(formData.get("deliveryFee") ?? 0),
    pickupAddress: String(formData.get("pickupAddress")),
    dropoffAddress: String(formData.get("dropoffAddress")),
    promoCode: String(formData.get("promoCode") || ""),
    paymentMethod: String(formData.get("paymentMethod") || "cod"),
    pickupLat: Number(formData.get("pickupLat") || 0) || undefined,
    pickupLng: Number(formData.get("pickupLng") || 0) || undefined,
    dropoffLat: Number(formData.get("dropoffLat") || 0) || undefined,
    dropoffLng: Number(formData.get("dropoffLng") || 0) || undefined,
    distanceKm: Number(formData.get("distanceKm") || 0) || undefined,
    etaMinutes: Number(formData.get("etaMinutes") || 0) || undefined,
  });

  revalidatePath("/customer/orders");
}

export async function updateOrderStatusAction(formData: FormData) {
  await updateOrderStatus({
    orderId: String(formData.get("orderId")),
    nextStatus: String(formData.get("nextStatus")),
  });

  revalidatePath("/shop/orders");
  revalidatePath("/customer/orders");
}
