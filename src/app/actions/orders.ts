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

function parseServiceSelections(value: FormDataEntryValue | null): Array<{
  serviceId: string;
  loads: number;
  selectedOptionIds?: string[];
}> {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is { serviceId: string; loads: number; selectedOptionIds?: string[] } =>
            Boolean(entry) &&
            typeof entry === "object" &&
            typeof (entry as { serviceId?: unknown }).serviceId === "string" &&
            typeof (entry as { loads?: unknown }).loads === "number",
        )
      : [];
  } catch {
    return [];
  }
}

function parseIsoDateOrThrow(value: FormDataEntryValue | null, fieldName: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing ${fieldName}`);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return parsed.toISOString();
}

function normalizePhoneNumberOrThrow(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Missing contactPhone");
  }

  const digits = value.replace(/\D/g, "");

  if (/^09\d{9}$/.test(digits)) {
    return `+63${digits.slice(1)}`;
  }

  if (/^9\d{9}$/.test(digits)) {
    return `+63${digits}`;
  }

  if (/^63\d{10}$/.test(digits)) {
    return `+${digits}`;
  }

  throw new Error("Invalid contactPhone");
}

export async function createOrderAction(formData: FormData) {
  try {
    const serviceSelections = parseServiceSelections(formData.get("serviceSelections"));
    const pickupDateIso = parseIsoDateOrThrow(formData.get("pickupDate"), "pickupDate");
    const deliveryDateIso = parseIsoDateOrThrow(formData.get("deliveryDate"), "deliveryDate");
    const contactPhone = normalizePhoneNumberOrThrow(formData.get("contactPhone"));

    if (new Date(deliveryDateIso).getTime() < new Date(pickupDateIso).getTime()) {
      throw new Error("deliveryDate must be after pickupDate");
    }

    const createdOrder = await createOrder({
      shopId: String(formData.get("shopId")),
      serviceId: String(formData.get("serviceId")),
      weightEstimate: Number(formData.get("weightEstimate")),
      selectedOptionIds: parseSelectedOptionIds(formData.get("selectedOptionIds")),
      serviceSelections,
      pickupDate: pickupDateIso,
      deliveryDate: deliveryDateIso,
      deliveryFee: Number(formData.get("deliveryFee") ?? 0),
      tipAmount: Number(formData.get("tipAmount") ?? 0),
      contactPhone,
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
    const bucket = String(formData.get("bucket") ?? "");
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

    if (bucket) {
      nextSearch.set("bucket", bucket);
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
