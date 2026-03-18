import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export type AddressLabel = "home" | "work" | "partner" | "other";

export type CustomerAddress = {
  id: string;
  customer_id: string;
  label: AddressLabel;
  address_line: string;
  unit_details: string | null;
  delivery_instructions: string | null;
  lat: number;
  lng: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type UpsertCustomerAddressInput = {
  label: AddressLabel;
  address_line: string;
  unit_details?: string | null;
  delivery_instructions?: string | null;
  lat: number;
  lng: number;
  is_default?: boolean;
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

async function syncProfileLocation(address: CustomerAddress): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      address: address.address_line,
      preferred_lat: address.lat,
      preferred_lng: address.lng,
    })
    .eq("id", address.customer_id);
}

export async function listCustomerAddresses(): Promise<CustomerAddress[]> {
  const userId = await getCurrentCustomerUserId();
  if (!userId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("id, customer_id, label, address_line, unit_details, delivery_instructions, lat, lng, is_default, created_at, updated_at")
    .eq("customer_id", userId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load addresses");
  }

  return (data ?? []) as CustomerAddress[];
}

export async function getSelectedCustomerAddress(): Promise<CustomerAddress | null> {
  const addresses = await listCustomerAddresses();
  if (addresses.length === 0) return null;
  return addresses.find((address) => address.is_default) ?? addresses[0] ?? null;
}

export async function createCustomerAddress(input: UpsertCustomerAddressInput): Promise<CustomerAddress> {
  const userId = await getCurrentCustomerUserId();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const payload = {
    customer_id: userId,
    label: input.label,
    address_line: input.address_line,
    unit_details: input.unit_details ?? null,
    delivery_instructions: input.delivery_instructions ?? null,
    lat: input.lat,
    lng: input.lng,
    is_default: Boolean(input.is_default),
  };

  const { data, error } = await supabase
    .from("customer_addresses")
    .insert(payload)
    .select("id, customer_id, label, address_line, unit_details, delivery_instructions, lat, lng, is_default, created_at, updated_at")
    .single<CustomerAddress>();

  if (error || !data) {
    throw new Error(error?.message || "Unable to create address");
  }

  if (data.is_default) {
    await syncProfileLocation(data);
  }

  return data;
}

export async function upsertSelectedCustomerAddress(input: UpsertCustomerAddressInput): Promise<CustomerAddress> {
  const userId = await getCurrentCustomerUserId();
  if (!userId) throw new Error("Unauthorized");

  const selectedAddress = await getSelectedCustomerAddress();
  if (!selectedAddress) {
    return createCustomerAddress({
      ...input,
      is_default: true,
    });
  }

  return updateCustomerAddress(selectedAddress.id, {
    ...input,
    is_default: true,
  });
}

export async function updateCustomerAddress(addressId: string, input: UpsertCustomerAddressInput): Promise<CustomerAddress> {
  const userId = await getCurrentCustomerUserId();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .update({
      label: input.label,
      address_line: input.address_line,
      unit_details: input.unit_details ?? null,
      delivery_instructions: input.delivery_instructions ?? null,
      lat: input.lat,
      lng: input.lng,
      is_default: Boolean(input.is_default),
    })
    .eq("id", addressId)
    .eq("customer_id", userId)
    .select("id, customer_id, label, address_line, unit_details, delivery_instructions, lat, lng, is_default, created_at, updated_at")
    .single<CustomerAddress>();

  if (error || !data) {
    throw new Error(error?.message || "Unable to update address");
  }

  if (data.is_default) {
    await syncProfileLocation(data);
  }

  return data;
}

export async function setDefaultCustomerAddress(addressId: string): Promise<CustomerAddress> {
  const userId = await getCurrentCustomerUserId();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("customer_id", userId)
    .select("id, customer_id, label, address_line, unit_details, delivery_instructions, lat, lng, is_default, created_at, updated_at")
    .single<CustomerAddress>();

  if (error || !data) {
    throw new Error(error?.message || "Unable to set default address");
  }

  await syncProfileLocation(data);
  return data;
}

export async function deleteCustomerAddress(addressId: string): Promise<void> {
  const userId = await getCurrentCustomerUserId();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data: deletedAddress } = await supabase
    .from("customer_addresses")
    .select("is_default")
    .eq("id", addressId)
    .eq("customer_id", userId)
    .single<{ is_default: boolean }>();

  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("customer_id", userId);

  if (error) {
    throw new Error(error.message || "Unable to delete address");
  }

  if (deletedAddress?.is_default) {
    const { data: nextDefault } = await supabase
      .from("customer_addresses")
      .select("id, customer_id, label, address_line, unit_details, delivery_instructions, lat, lng, is_default, created_at, updated_at")
      .eq("customer_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<CustomerAddress>();

    if (nextDefault) {
      await setDefaultCustomerAddress(nextDefault.id);
      return;
    }

    await supabase
      .from("profiles")
      .update({
        address: null,
        preferred_lat: null,
        preferred_lng: null,
      })
      .eq("id", userId);
  }
}
