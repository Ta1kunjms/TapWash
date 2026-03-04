"use server";

import { revalidatePath } from "next/cache";
import { setUserSuspended, verifyShop } from "@/services/admin";

export async function verifyShopAction(formData: FormData) {
  const shopId = String(formData.get("shopId"));
  const isVerified = String(formData.get("isVerified")) === "true";
  await verifyShop(shopId, isVerified);
  revalidatePath("/admin/shops");
  revalidatePath("/customer");
}

export async function suspendUserAction(formData: FormData) {
  const userId = String(formData.get("userId"));
  const isSuspended = String(formData.get("isSuspended")) === "true";
  await setUserSuspended(userId, isSuspended);
  revalidatePath("/admin/users");
}
