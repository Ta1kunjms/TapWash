"use server";

import { revalidatePath } from "next/cache";
import { assignRider, createVoucher, toggleVoucher, updateDeliveryStatus, updateRiderLocation } from "@/services/riders";
import { notify } from "@/lib/notify";

export async function assignRiderAction(formData: FormData) {
  try {
    await assignRider(String(formData.get("orderId")), String(formData.get("riderId")));
    revalidatePath("/shop/dispatch");
    revalidatePath("/shop/orders");
    revalidatePath("/customer/orders");
    notify.success("Rider assigned successfully");
  } catch (error) {
    notify.error("Failed to assign rider");
    console.error("Error assigning rider:", error);
  }
}

export async function updateDeliveryStatusAction(formData: FormData) {
  try {
    await updateDeliveryStatus(
      String(formData.get("orderId")),
      String(formData.get("status")) as "picked_up" | "in_transit" | "delivered" | "failed" | "cancelled",
    );
    revalidatePath("/shop/dispatch");
    revalidatePath("/shop/orders");
    revalidatePath("/customer/orders");
    notify.success("Delivery status updated successfully");
  } catch (error) {
    notify.error("Failed to update delivery status");
    console.error("Error updating delivery status:", error);
  }
}

export async function updateRiderLocationAction(formData: FormData) {
  try {
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
  } catch (error) {
    console.error("Error updating rider location:", error);
  }
}

export async function createVoucherAction(formData: FormData) {
  try {
    await createVoucher({
      code: String(formData.get("code")),
      description: String(formData.get("description")),
      discountType: String(formData.get("discountType")) as "fixed" | "percent",
      discountValue: Number(formData.get("discountValue")),
      minOrderAmount: Number(formData.get("minOrderAmount")),
    });
    revalidatePath("/admin/vouchers");
    notify.success("Voucher created successfully");
  } catch (error) {
    notify.error("Failed to create voucher");
    console.error("Error creating voucher:", error);
  }
}

export async function toggleVoucherAction(formData: FormData) {
  try {
    await toggleVoucher(String(formData.get("voucherId")), String(formData.get("isActive")) === "true");
    revalidatePath("/admin/vouchers");
    const isActive = String(formData.get("isActive")) === "true";
    notify.success(isActive ? "Voucher activated successfully" : "Voucher deactivated successfully");
  } catch (error) {
    notify.error("Failed to update voucher status");
    console.error("Error toggling voucher:", error);
  }
}
