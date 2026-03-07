"use server";

import { revalidatePath } from "next/cache";
import { toggleShopFavorite } from "@/services/favorites";

export async function toggleFavoriteAction(formData: FormData) {
  const shopId = String(formData.get("shopId") ?? "").trim();
  if (!shopId) return;

  await toggleShopFavorite(shopId);

  revalidatePath("/customer");
  revalidatePath("/customer/shops");
  revalidatePath("/customer/favorites");
  revalidatePath("/customer/notifications");

  const revalidateDetailPath = String(formData.get("shopDetailPath") ?? "").trim();
  if (revalidateDetailPath.startsWith("/customer/shops/")) {
    revalidatePath(revalidateDetailPath);
  }
}
