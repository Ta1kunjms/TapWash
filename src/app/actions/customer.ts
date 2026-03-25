"use server";

import { revalidatePath } from "next/cache";
import { toggleShopFavorite } from "@/services/favorites";
import { updateCustomerAvatar } from "@/services/customer";
import { updateCustomerAvatarSchema } from "@/lib/validators/customer";

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

export async function updateCustomerAvatarAction(input: { avatarKey: string } | null | undefined) {
  const parsed = updateCustomerAvatarSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Please choose a valid mascot avatar.",
    };
  }

  try {
    const avatarKey = await updateCustomerAvatar(parsed.data.avatarKey);

    revalidatePath("/customer");
    revalidatePath("/customer/favorites");
    revalidatePath("/customer/notifications");
    revalidatePath("/customer/requests");
    revalidatePath("/customer/settings");
    revalidatePath("/customer/settings/profile");

    return {
      ok: true as const,
      avatarKey,
      message: "Mascot avatar updated.",
    };
  } catch (error) {
    console.error("Error updating customer avatar:", error);
    return {
      ok: false as const,
      message: "We could not save your avatar right now. Please try again.",
    };
  }
}
