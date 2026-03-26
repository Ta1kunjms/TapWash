import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod, SupportedLanguage, UserRole } from "@/types/domain";
import {
  type CustomerAvatarKey,
  normalizeCustomerAvatarKey,
} from "@/lib/avatar-catalog";

export type CustomerProfile = {
  id: string;
  email: string;
  username: string | null;
  first_name: string | null;
  surname: string | null;
  avatar_key: CustomerAvatarKey;
  phone: string;
  address: string;
  preferred_language: SupportedLanguage;
  preferred_lat: number | null;
  preferred_lng: number | null;
  notification_last_read_at: string | null;
  location_permission_status: "granted" | "denied" | "unsupported" | null;
  location_permission_updated_at: string | null;
  location_onboarding_last_prompted_at: string | null;
};

export type CustomerPaymentPreference = {
  id: string;
  customer_id: string;
  method: PaymentMethod;
  display_label: string | null;
  masked_reference: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

async function getCurrentCustomerUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: UserRole }>();

  return profile?.role === "customer" ? user.id : null;
}

export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, first_name, surname, avatar_key, phone, address, preferred_language, preferred_lat, preferred_lng, notification_last_read_at, location_permission_status, location_permission_updated_at, location_onboarding_last_prompted_at")
    .eq("id", user.id)
    .single<{
      username: string | null;
      first_name: string | null;
      surname: string | null;
      avatar_key: string | null;
      phone: string | null;
      address: string | null;
      preferred_language: SupportedLanguage | null;
      preferred_lat: number | null;
      preferred_lng: number | null;
      notification_last_read_at: string | null;
      location_permission_status: "granted" | "denied" | "unsupported" | null;
      location_permission_updated_at: string | null;
      location_onboarding_last_prompted_at: string | null;
    }>();

  return {
    id: user.id,
    email: user.email ?? "",
    username: profile?.username ?? null,
    first_name: profile?.first_name ?? null,
    surname: profile?.surname ?? null,
    avatar_key: normalizeCustomerAvatarKey(profile?.avatar_key),
    phone: profile?.phone ?? "",
    address: profile?.address ?? "Set Location",
    preferred_language: profile?.preferred_language ?? "en",
    preferred_lat: profile?.preferred_lat ?? null,
    preferred_lng: profile?.preferred_lng ?? null,
    notification_last_read_at: profile?.notification_last_read_at ?? null,
    location_permission_status: profile?.location_permission_status ?? null,
    location_permission_updated_at: profile?.location_permission_updated_at ?? null,
    location_onboarding_last_prompted_at: profile?.location_onboarding_last_prompted_at ?? null,
  };
}

export async function updateCustomerAvatar(avatarKey: CustomerAvatarKey): Promise<CustomerAvatarKey> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Please log in to update your avatar.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_key: avatarKey })
    .eq("id", user.id);

  if (error) {
    throw new Error("We could not save your avatar right now. Please try again.");
  }

  return avatarKey;
}

export async function updateCustomerProfile(input: {
  firstName?: string;
  surname?: string;
  phone?: string;
  address?: string;
}): Promise<void> {
  const userId = await getCurrentCustomerUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: input.firstName?.trim() ? input.firstName.trim() : null,
      surname: input.surname?.trim() ? input.surname.trim() : null,
      phone: input.phone?.trim() ? input.phone.trim() : null,
      address: input.address?.trim() ? input.address.trim() : null,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message || "Unable to update profile.");
  }
}

export async function changeCustomerPassword(currentPassword: string, newPassword: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new Error("Please sign in again before changing password.");
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    throw new Error("Current password is incorrect.");
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    throw new Error(updateError.message || "Unable to update password.");
  }
}

export async function updateCustomerLanguage(language: SupportedLanguage): Promise<void> {
  const userId = await getCurrentCustomerUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ preferred_language: language, language_updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message || "Unable to update language.");
  }
}

export async function listCustomerPaymentPreferences(): Promise<CustomerPaymentPreference[]> {
  const userId = await getCurrentCustomerUserId();
  if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_payment_preferences")
    .select("id, customer_id, method, display_label, masked_reference, is_default, created_at, updated_at")
    .eq("customer_id", userId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load payment preferences.");
  }

  return (data ?? []) as CustomerPaymentPreference[];
}

export async function createCustomerPaymentPreference(input: {
  method: PaymentMethod;
  displayLabel?: string;
  maskedReference?: string;
  isDefault?: boolean;
}): Promise<void> {
  const userId = await getCurrentCustomerUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  if (input.isDefault) {
    await supabase
      .from("customer_payment_preferences")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq("customer_id", userId);
  }

  const { error } = await supabase
    .from("customer_payment_preferences")
    .insert({
      customer_id: userId,
      method: input.method,
      display_label: input.displayLabel?.trim() || null,
      masked_reference: input.maskedReference?.trim() || null,
      is_default: Boolean(input.isDefault),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(error.message || "Unable to save payment preference.");
  }
}

export async function updateCustomerPaymentPreference(input: {
  preferenceId: string;
  method: PaymentMethod;
  displayLabel?: string;
  maskedReference?: string;
  isDefault?: boolean;
}): Promise<void> {
  const userId = await getCurrentCustomerUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  if (input.isDefault) {
    await supabase
      .from("customer_payment_preferences")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq("customer_id", userId);
  }

  const { error } = await supabase
    .from("customer_payment_preferences")
    .update({
      method: input.method,
      display_label: input.displayLabel?.trim() || null,
      masked_reference: input.maskedReference?.trim() || null,
      is_default: Boolean(input.isDefault),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.preferenceId)
    .eq("customer_id", userId);

  if (error) {
    throw new Error(error.message || "Unable to update payment preference.");
  }
}

export async function setDefaultCustomerPaymentPreference(preferenceId: string): Promise<void> {
  const userId = await getCurrentCustomerUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  await supabase
    .from("customer_payment_preferences")
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq("customer_id", userId);

  const { error } = await supabase
    .from("customer_payment_preferences")
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq("id", preferenceId)
    .eq("customer_id", userId);

  if (error) {
    throw new Error(error.message || "Unable to set default payment preference.");
  }
}

export async function deleteCustomerPaymentPreference(preferenceId: string): Promise<void> {
  const userId = await getCurrentCustomerUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data: deleted } = await supabase
    .from("customer_payment_preferences")
    .select("id, is_default")
    .eq("id", preferenceId)
    .eq("customer_id", userId)
    .maybeSingle<{ id: string; is_default: boolean }>();

  const { error } = await supabase
    .from("customer_payment_preferences")
    .delete()
    .eq("id", preferenceId)
    .eq("customer_id", userId);

  if (error) {
    throw new Error(error.message || "Unable to delete payment preference.");
  }

  if (deleted?.is_default) {
    const { data: fallback } = await supabase
      .from("customer_payment_preferences")
      .select("id")
      .eq("customer_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (fallback?.id) {
      await setDefaultCustomerPaymentPreference(fallback.id);
    }
  }
}

export async function getDefaultCustomerPaymentMethod(): Promise<PaymentMethod | null> {
  const preferences = await listCustomerPaymentPreferences();
  const preferred = preferences.find((entry) => entry.is_default) ?? preferences[0] ?? null;
  return preferred?.method ?? null;
}

export function getInitials(firstName: string | null, surname: string | null) {
  const parts = [];
  if (firstName) parts.push(firstName);
  if (surname) parts.push(surname);
  
  return parts
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
