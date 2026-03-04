"use server";

import { revalidatePath } from "next/cache";
import { assignRider, createVoucher, toggleVoucher, updateDeliveryStatus, updateRiderLocation } from "@/services/riders";

export async function assignRiderAction(formData: FormData) {
  await assignRider(String(formData.get("orderId")), String(formData.get("riderId")));
  revalidatePath("/shop/dispatch");
  revalidatePath("/shop/orders");
  revalidatePath("/customer/orders");
}

export async function updateDeliveryStatusAction(formData: FormData) {
  await updateDeliveryStatus(
    String(formData.get("orderId")),
    String(formData.get("status")) as "picked_up" | "in_transit" | "delivered" | "failed" | "cancelled",
  );
  revalidatePath("/shop/dispatch");
  revalidatePath("/shop/orders");
  revalidatePath("/customer/orders");
}

export async function updateRiderLocationAction(formData: FormData) {
  await updateRiderLocation({
    orderId: String(formData.get("orderId")),
    riderId: String(formData.get("riderId")),
    lat: Number(formData.get("lat")),
    lng: Number(formData.get("lng")),
    heading: Number(formData.get("heading") || 0) || undefined,
    speedKph: Number(formData.get("speedKph") || 0) || undefined,
  });

  revalidatePath("/shop/dispatch");
  revalidatePath("/customer/orders");
}

export async function createVoucherAction(formData: FormData) {
  await createVoucher({
    code: String(formData.get("code")),
    description: String(formData.get("description")),
    discountType: String(formData.get("discountType")) as "fixed" | "percent",
    discountValue: Number(formData.get("discountValue")),
    minOrderAmount: Number(formData.get("minOrderAmount")),
  });
  revalidatePath("/admin/vouchers");
}

export async function toggleVoucherAction(formData: FormData) {
  await toggleVoucher(String(formData.get("voucherId")), String(formData.get("isActive")) === "true");
  revalidatePath("/admin/vouchers");
}
