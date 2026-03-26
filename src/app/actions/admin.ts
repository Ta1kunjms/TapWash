"use server";

import { revalidatePath } from "next/cache";
import {
  createHomeOffer,
  createAdminVoucher,
  createShop,
  deleteHomeOffer,
  deleteShop,
  deleteVoucher,
  setUserSuspended,
  toggleHomeOffer,
  updateHomeOffer,
  toggleVoucher,
  updateShop,
  updateUserProfile,
  updateVoucher,
  verifyShop,
} from "@/services/admin";
import { updateSupportTicketStatus } from "@/services/support";
import { supportTicketStatusUpdateSchema } from "@/lib/validators/settings";

function toNumber(value: FormDataEntryValue | null, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function verifyShopAction(formData: FormData) {
  try {
    const shopId = String(formData.get("shopId"));
    const isVerified = String(formData.get("isVerified")) === "true";
    await verifyShop(shopId, isVerified);
    revalidatePath("/admin/shops");
    revalidatePath("/customer");
  } catch (error) {
    console.error("Error verifying shop:", error);
  }
}

export async function suspendUserAction(formData: FormData) {
  try {
    const userId = String(formData.get("userId"));
    const isSuspended = String(formData.get("isSuspended")) === "true";
    await setUserSuspended(userId, isSuspended);
    revalidatePath("/admin/users");
  } catch (error) {
    console.error("Error suspending user:", error);
  }
}

export async function updateUserProfileAction(formData: FormData) {
  try {
    await updateUserProfile({
      userId: String(formData.get("userId")),
      firstName: String(formData.get("firstName") ?? "").trim(),
      surname: String(formData.get("surname") ?? "").trim(),
      role: String(formData.get("role")) as "customer" | "shop_owner" | "admin",
    });
    revalidatePath("/admin/users");
  } catch (error) {
    console.error("Error updating user profile:", error);
  }
}

export async function createShopAction(formData: FormData) {
  try {
    await createShop({
      ownerId: String(formData.get("ownerId")),
      shopName: String(formData.get("shopName") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      coverImageUrl: String(formData.get("coverImageUrl") ?? "").trim(),
      startingPrice: toNumber(formData.get("startingPrice"), 0),
      loadCapacityKg: toNumber(formData.get("loadCapacityKg"), 8),
      commissionPercentage: toNumber(formData.get("commissionPercentage"), 10),
    });
    revalidatePath("/admin/shops");
    revalidatePath("/customer");
  } catch (error) {
    console.error("Error creating shop:", error);
  }
}

export async function updateShopAction(formData: FormData) {
  try {
    await updateShop({
      shopId: String(formData.get("shopId")),
      ownerId: String(formData.get("ownerId")),
      shopName: String(formData.get("shopName") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      coverImageUrl: String(formData.get("coverImageUrl") ?? "").trim(),
      startingPrice: toNumber(formData.get("startingPrice"), 0),
      loadCapacityKg: toNumber(formData.get("loadCapacityKg"), 8),
      commissionPercentage: toNumber(formData.get("commissionPercentage"), 10),
    });
    revalidatePath("/admin/shops");
    revalidatePath("/customer");
  } catch (error) {
    console.error("Error updating shop:", error);
  }
}

export async function deleteShopAction(formData: FormData) {
  try {
    await deleteShop(String(formData.get("shopId")));
    revalidatePath("/admin/shops");
    revalidatePath("/customer");
  } catch (error) {
    console.error("Error deleting shop:", error);
  }
}

export async function createVoucherAction(formData: FormData) {
  try {
    await createAdminVoucher({
      code: String(formData.get("code") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      discountType: String(formData.get("discountType")) as "fixed" | "percent",
      discountValue: toNumber(formData.get("discountValue"), 0),
      minOrderAmount: toNumber(formData.get("minOrderAmount"), 0),
      maxDiscountAmount: toNumber(formData.get("maxDiscountAmount"), 0) || undefined,
    });
    revalidatePath("/admin/vouchers");
  } catch (error) {
    console.error("Error creating voucher:", error);
  }
}

export async function toggleVoucherAction(formData: FormData) {
  try {
    const isActive = String(formData.get("isActive")) === "true";
    await toggleVoucher(String(formData.get("voucherId")), isActive);
    revalidatePath("/admin/vouchers");
  } catch (error) {
    console.error("Error toggling voucher:", error);
  }
}

export async function updateVoucherAction(formData: FormData) {
  try {
    await updateVoucher({
      voucherId: String(formData.get("voucherId")),
      code: String(formData.get("code") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      discountType: String(formData.get("discountType")) as "fixed" | "percent",
      discountValue: toNumber(formData.get("discountValue"), 0),
      minOrderAmount: toNumber(formData.get("minOrderAmount"), 0),
      maxDiscountAmount: toNumber(formData.get("maxDiscountAmount"), 0) || undefined,
      isActive: String(formData.get("isActive")) === "true",
    });
    revalidatePath("/admin/vouchers");
  } catch (error) {
    console.error("Error updating voucher:", error);
  }
}

export async function deleteVoucherAction(formData: FormData) {
  try {
    await deleteVoucher(String(formData.get("voucherId")));
    revalidatePath("/admin/vouchers");
  } catch (error) {
    console.error("Error deleting voucher:", error);
  }
}

export async function updateSupportTicketStatusAction(formData: FormData) {
  const parsed = supportTicketStatusUpdateSchema.safeParse({
    ticketId: formData.get("ticketId"),
    status: formData.get("status"),
    adminNote: formData.get("adminNote"),
  });

  if (!parsed.success) {
    console.error("Invalid support ticket payload", parsed.error.flatten());
    return;
  }

  try {
    await updateSupportTicketStatus(parsed.data);
    revalidatePath("/admin/support");
    revalidatePath("/customer/settings/help");
  } catch (error) {
    console.error("Error updating support ticket:", error);
  }
}

export async function createHomeOfferAction(formData: FormData) {
  try {
    await createHomeOffer({
      badgeLabel: String(formData.get("badgeLabel") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      subtitle: String(formData.get("subtitle") ?? "").trim(),
      ctaLabel: String(formData.get("ctaLabel") ?? "").trim(),
      ctaHref: String(formData.get("ctaHref") ?? "").trim(),
      accentFrom: String(formData.get("accentFrom") ?? "").trim(),
      accentTo: String(formData.get("accentTo") ?? "").trim(),
      audience: String(formData.get("audience") ?? "all") as "all" | "new" | "returning" | "favorites",
      priority: toNumber(formData.get("priority"), 0),
      startsAt: String(formData.get("startsAt") ?? "").trim(),
      endsAt: String(formData.get("endsAt") ?? "").trim(),
    });
    revalidatePath("/admin/offers");
    revalidatePath("/admin");
    revalidatePath("/customer");
  } catch (error) {
    console.error("Error creating home offer:", error);
  }
}

export async function updateHomeOfferAction(formData: FormData) {
  try {
    await updateHomeOffer({
      offerId: String(formData.get("offerId") ?? "").trim(),
      badgeLabel: String(formData.get("badgeLabel") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      subtitle: String(formData.get("subtitle") ?? "").trim(),
      ctaLabel: String(formData.get("ctaLabel") ?? "").trim(),
      ctaHref: String(formData.get("ctaHref") ?? "").trim(),
      accentFrom: String(formData.get("accentFrom") ?? "").trim(),
      accentTo: String(formData.get("accentTo") ?? "").trim(),
      audience: String(formData.get("audience") ?? "all") as "all" | "new" | "returning" | "favorites",
      priority: toNumber(formData.get("priority"), 0),
      startsAt: String(formData.get("startsAt") ?? "").trim(),
      endsAt: String(formData.get("endsAt") ?? "").trim(),
      isActive: String(formData.get("isActive")) === "true",
    });
    revalidatePath("/admin/offers");
    revalidatePath("/customer");
  } catch (error) {
    console.error("Error updating home offer:", error);
  }
}

export async function toggleHomeOfferAction(formData: FormData) {
  try {
    const isActive = String(formData.get("isActive")) === "true";
    await toggleHomeOffer(String(formData.get("offerId") ?? ""), isActive);
    revalidatePath("/admin/offers");
    revalidatePath("/customer");
  } catch (error) {
    console.error("Error toggling home offer:", error);
  }
}

export async function deleteHomeOfferAction(formData: FormData) {
  try {
    await deleteHomeOffer(String(formData.get("offerId") ?? ""));
    revalidatePath("/admin/offers");
    revalidatePath("/customer");
  } catch (error) {
    console.error("Error deleting home offer:", error);
  }
}
