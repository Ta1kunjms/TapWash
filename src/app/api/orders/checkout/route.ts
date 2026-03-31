import { createOrder } from "@/services/orders";
import type { PaymentMethod } from "@/types/domain";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

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

function numberOrUndefined(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildCheckoutErrorRedirect(formData: FormData, errorMessage: string): string {
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

  return `/customer/orders/checkout?${nextSearch.toString()}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();

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
      pickupLat: numberOrUndefined(formData.get("pickupLat")),
      pickupLng: numberOrUndefined(formData.get("pickupLng")),
      dropoffLat: numberOrUndefined(formData.get("dropoffLat")),
      dropoffLng: numberOrUndefined(formData.get("dropoffLng")),
      distanceKm: numberOrUndefined(formData.get("distanceKm")),
      etaMinutes: numberOrUndefined(formData.get("etaMinutes")),
    });

    revalidatePath("/customer/orders");
    revalidatePath("/customer/requests");

    return NextResponse.json({
      ok: true,
      redirectTo: `/customer/orders/confirmation?orderId=${encodeURIComponent(createdOrder.id)}`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error && error.message
      ? error.message
      : "Unable to create booking. Please review your details and try again.";

    const status = errorMessage === "Unauthorized" ? 401 : 400;
    const redirectTo = status === 401
      ? "/login"
      : buildCheckoutErrorRedirect(formData, errorMessage);

    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
        redirectTo,
      },
      { status },
    );
  }
}