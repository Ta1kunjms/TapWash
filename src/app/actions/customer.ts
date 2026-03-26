"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { toggleShopFavorite } from "@/services/favorites";
import {
  changeCustomerPassword,
  createCustomerPaymentPreference,
  deleteCustomerPaymentPreference,
  setDefaultCustomerPaymentPreference,
  updateCustomerAvatar,
  updateCustomerLanguage,
  updateCustomerPaymentPreference,
  updateCustomerProfile,
} from "@/services/customer";
import { createSupportTicket } from "@/services/support";
import { updateCustomerAvatarSchema } from "@/lib/validators/customer";
import {
  changePasswordSchema,
  customerPaymentPreferenceSchema,
  deletePaymentPreferenceSchema,
  setDefaultPaymentPreferenceSchema,
  supportedLanguageSchema,
  supportTicketCreateSchema,
  updateCustomerProfileSchema,
  updatePaymentPreferenceSchema,
} from "@/lib/validators/settings";

type SettingsActionResult = {
  ok: boolean;
  message: string;
};

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

export async function updateCustomerProfileAction(formData: FormData): Promise<SettingsActionResult> {
  const parsed = updateCustomerProfileSchema.safeParse({
    firstName: formData.get("first_name"),
    surname: formData.get("surname"),
    phone: formData.get("phone"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please review your profile details.",
    };
  }

  try {
    await updateCustomerProfile(parsed.data);
    revalidatePath("/customer");
    revalidatePath("/customer/settings");
    revalidatePath("/customer/settings/profile");
    revalidatePath("/customer/orders/checkout");
    return {
      ok: true,
      message: "Profile updated.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to update profile.",
    };
  }
}

export async function changeCustomerPasswordAction(formData: FormData): Promise<SettingsActionResult> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("current_password"),
    newPassword: formData.get("new_password"),
    confirmPassword: formData.get("confirm_password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check your password details.",
    };
  }

  try {
    await changeCustomerPassword(parsed.data.currentPassword, parsed.data.newPassword);
    return {
      ok: true,
      message: "Password updated.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to update password.",
    };
  }
}

export async function createPaymentPreferenceAction(formData: FormData): Promise<SettingsActionResult> {
  const parsed = customerPaymentPreferenceSchema.safeParse({
    method: formData.get("method"),
    displayLabel: formData.get("display_label"),
    maskedReference: formData.get("masked_reference"),
    isDefault: String(formData.get("is_default")) === "true",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please review your payment preference.",
    };
  }

  try {
    await createCustomerPaymentPreference(parsed.data);
    revalidatePath("/customer/settings/payment");
    revalidatePath("/customer/orders/checkout");
    return {
      ok: true,
      message: "Payment preference saved.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to save payment preference.",
    };
  }
}

export async function updatePaymentPreferenceAction(formData: FormData): Promise<SettingsActionResult> {
  const parsed = updatePaymentPreferenceSchema.safeParse({
    preferenceId: formData.get("preference_id"),
    method: formData.get("method"),
    displayLabel: formData.get("display_label"),
    maskedReference: formData.get("masked_reference"),
    isDefault: String(formData.get("is_default")) === "true",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please review your payment preference.",
    };
  }

  try {
    await updateCustomerPaymentPreference(parsed.data);
    revalidatePath("/customer/settings/payment");
    revalidatePath("/customer/orders/checkout");
    return {
      ok: true,
      message: "Payment preference updated.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to update payment preference.",
    };
  }
}

export async function deletePaymentPreferenceAction(formData: FormData): Promise<SettingsActionResult> {
  const parsed = deletePaymentPreferenceSchema.safeParse({
    preferenceId: formData.get("preference_id"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid payment preference.",
    };
  }

  try {
    await deleteCustomerPaymentPreference(parsed.data.preferenceId);
    revalidatePath("/customer/settings/payment");
    revalidatePath("/customer/orders/checkout");
    return {
      ok: true,
      message: "Payment preference removed.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to remove payment preference.",
    };
  }
}

export async function setDefaultPaymentPreferenceAction(formData: FormData): Promise<SettingsActionResult> {
  const parsed = setDefaultPaymentPreferenceSchema.safeParse({
    preferenceId: formData.get("preference_id"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid payment preference.",
    };
  }

  try {
    await setDefaultCustomerPaymentPreference(parsed.data.preferenceId);
    revalidatePath("/customer/settings/payment");
    revalidatePath("/customer/orders/checkout");
    return {
      ok: true,
      message: "Default payment preference updated.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to set default payment preference.",
    };
  }
}

export async function updateCustomerLanguageAction(formData: FormData): Promise<SettingsActionResult> {
  const parsed = supportedLanguageSchema.safeParse(formData.get("language"));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Unsupported language.",
    };
  }

  try {
    await updateCustomerLanguage(parsed.data);
    const cookieStore = await cookies();
    cookieStore.set("tapwash.locale", parsed.data, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    revalidatePath("/customer");
    revalidatePath("/customer/settings");
    revalidatePath("/customer/settings/language");
    return {
      ok: true,
      message: "Language updated.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to update language.",
    };
  }
}

export async function createSupportTicketAction(formData: FormData): Promise<SettingsActionResult> {
  const parsed = supportTicketCreateSchema.safeParse({
    topic: formData.get("topic"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please review your support request.",
    };
  }

  try {
    await createSupportTicket(parsed.data);
    revalidatePath("/customer/settings/help");
    revalidatePath("/admin/support");
    return {
      ok: true,
      message: "Support request submitted.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to submit support request.",
    };
  }
}
