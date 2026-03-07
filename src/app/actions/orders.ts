"use server";

import { createOrder, updateOrderStatus } from "@/services/orders";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseSelectedOptionIds(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

export async function createOrderAction(formData: FormData) {
  try {
    const createdOrder = await createOrder({
      shopId: String(formData.get("shopId")),
      serviceId: String(formData.get("serviceId")),
      weightEstimate: Number(formData.get("weightEstimate")),
      selectedOptionIds: parseSelectedOptionIds(formData.get("selectedOptionIds")),
      pickupDate: new Date(String(formData.get("pickupDate"))).toISOString(),
      deliveryDate: formData.get("deliveryDate") ? new Date(String(formData.get("deliveryDate"))).toISOString() : undefined,
      deliveryFee: Number(formData.get("deliveryFee") ?? 0),
      tipAmount: Number(formData.get("tipAmount") ?? 0),
      contactPhone: String(formData.get("contactPhone") || ""),
      deliveryInstructions: String(formData.get("deliveryInstructions") || ""),
      riderNotes: String(formData.get("riderNotes") || ""),
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
    revalidatePath("/customer/requests");

    redirect(`/customer/orders/confirmation?orderId=${encodeURIComponent(createdOrder.id)}`);
  } catch {
    const shopId = String(formData.get("shopId") ?? "");
    const serviceId = String(formData.get("serviceId") ?? "");
    const weightEstimate = String(formData.get("weightEstimate") ?? "");
    const promoCode = String(formData.get("promoCode") ?? "");
    const nextSearch = new URLSearchParams();
    nextSearch.set("error", "Unable to create booking. Please review your details and try again.");

    if (shopId) {
      nextSearch.set("shopId", shopId);
    }

    if (serviceId) {
      nextSearch.set("serviceId", serviceId);
    }

    if (weightEstimate) {
      nextSearch.set("weight", weightEstimate);
    }

    if (promoCode) {
      nextSearch.set("promoCode", promoCode);
    }

    redirect(`/customer/orders/checkout?${nextSearch.toString()}`);
  }
}

export async function updateOrderStatusAction(formData: FormData) {
  await updateOrderStatus({
    orderId: String(formData.get("orderId")),
    nextStatus: String(formData.get("nextStatus")),
  });

  revalidatePath("/shop/orders");
  revalidatePath("/customer/orders");
}
