import { createClient } from "@/lib/supabase/server";

export type CustomerProfile = {
  id: string;
  email: string;
  first_name: string | null;
  surname: string | null;
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
    .select("first_name, surname, phone, address, preferred_lat, preferred_lng, notification_last_read_at, location_permission_status, location_permission_updated_at, location_onboarding_last_prompted_at")
    .eq("id", user.id)
    .single<{
      first_name: string | null;
      surname: string | null;
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
    first_name: profile?.first_name ?? null,
    surname: profile?.surname ?? null,
    phone: profile?.phone ?? "",
    address: profile?.address ?? "Brgy. Tambler, GSC",
    preferred_lat: profile?.preferred_lat ?? null,
    preferred_lng: profile?.preferred_lng ?? null,
    notification_last_read_at: profile?.notification_last_read_at ?? null,
    location_permission_status: profile?.location_permission_status ?? null,
    location_permission_updated_at: profile?.location_permission_updated_at ?? null,
    location_onboarding_last_prompted_at: profile?.location_onboarding_last_prompted_at ?? null,
  };
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
