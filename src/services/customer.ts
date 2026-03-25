import { createClient } from "@/lib/supabase/server";
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
  preferred_lat: number | null;
  preferred_lng: number | null;
  notification_last_read_at: string | null;
  location_permission_status: "granted" | "denied" | "unsupported" | null;
  location_permission_updated_at: string | null;
  location_onboarding_last_prompted_at: string | null;
};

export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, first_name, surname, avatar_key, phone, address, preferred_lat, preferred_lng, notification_last_read_at, location_permission_status, location_permission_updated_at, location_onboarding_last_prompted_at")
    .eq("id", user.id)
    .single<{
      username: string | null;
      first_name: string | null;
      surname: string | null;
      avatar_key: string | null;
      phone: string | null;
      address: string | null;
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
