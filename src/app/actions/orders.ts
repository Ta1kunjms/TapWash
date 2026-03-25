"use server";

import { createOrder, updateOrderStatus } from "@/services/orders";
import type { PaymentMethod } from "@/types/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  if (!("digest" in error)) {
    return false;
  }

  const digest = error.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

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

function parseOptionalIsoDate(value: FormDataEntryValue | null, fieldName: string): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) return undefined;

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

function parsePaymentMethodOrThrow(value: FormDataEntryValue | null): PaymentMethod {
  if (typeof value !== "string") {
    throw new Error("Missing paymentMethod");
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "cod" || normalized === "gcash" || normalized === "card") {
    return normalized;
  }

  throw new Error("Invalid paymentMethod");
}

export async function createOrderAction(formData: FormData) {
  try {
    const serviceSelections = parseServiceSelections(formData.get("serviceSelections"));
    const pickupDateIso = parseIsoDateOrThrow(formData.get("pickupDate"), "pickupDate");
    const deliveryDateIso = parseOptionalIsoDate(formData.get("deliveryDate"), "deliveryDate");
    const contactPhone = normalizePhoneNumberOrThrow(formData.get("contactPhone"));
    const paymentMethod = parsePaymentMethodOrThrow(formData.get("paymentMethod"));
    const promoCodeValue = formData.get("promoCode");
    const promoCode = typeof promoCodeValue === "string" && promoCodeValue.trim().length > 0
      ? promoCodeValue.trim().toUpperCase()
      : undefined;

    if (deliveryDateIso) {
      if (new Date(deliveryDateIso).getTime() < new Date(pickupDateIso).getTime()) {
        throw new Error("deliveryDate must be after pickupDate");
      }
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
      promoCode,
      paymentMethod,
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
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : "Unable to create booking. Please review your details and try again.";

    console.error("[createOrderAction] booking failed", {
      error: errorMessage,
      shopId: formData.get("shopId"),
      serviceId: formData.get("serviceId"),
    });

    const shopId = String(formData.get("shopId") ?? "");
    const serviceId = String(formData.get("serviceId") ?? "");
    const weightEstimate = String(formData.get("weightEstimate") ?? "");
    const promoCode = String(formData.get("promoCode") ?? "");
    const bucket = String(formData.get("bucket") ?? "");
    const nextSearch = new URLSearchParams();
    nextSearch.set("error", "Unable to create booking. Please review your details and try again.");
    nextSearch.set("errorDetail", errorMessage.slice(0, 180));

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

export async function cancelOrderDuringConfirmationAction(orderId: string) {
  try {
    await updateOrderStatus({
      orderId,
      nextStatus: "cancelled",
    });

    revalidatePath("/customer/orders");
    revalidatePath("/customer/requests");
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      message: "Unable to cancel this request now. You can continue to tracking.",
    };
  }
}
