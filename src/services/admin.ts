import { createClient } from "@/lib/supabase/server";

export interface AdminUserRow {
  id: string;
  first_name: string | null;
  surname: string | null;
  role: "customer" | "shop_owner" | "admin";
  is_suspended: boolean;
  created_at: string;
  displayName: string;
}

export interface AdminOwnerOption {
  id: string;
  displayName: string;
}

export interface AdminShopRow {
  id: string;
  owner_id: string;
  shop_name: string;
  description: string | null;
  location: string;
  cover_image_url: string | null;
  starting_price: number;
  load_capacity_kg: number;
  commission_percentage: number;
  is_verified: boolean;
  created_at: string;
}

export interface AdminVoucherRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: "fixed" | "percent";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export async function verifyShop(shopId: string, isVerified: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("laundry_shops")
    .update({ is_verified: isVerified })
    .eq("id", shopId);

  if (error) throw error;
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, surname, role, is_suspended, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((user) => ({
    ...user,
    displayName: [user.first_name, user.surname].filter(Boolean).join(" ").trim() || "Unnamed User",
  }));
}

export async function setUserSuspended(userId: string, isSuspended: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_suspended: isSuspended })
    .eq("id", userId);

  if (error) throw error;
}

export async function updateUserProfile(input: {
  userId: string;
  firstName: string;
  surname: string;
  role: "customer" | "shop_owner" | "admin";
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: input.firstName,
      surname: input.surname,
      role: input.role,
    })
    .eq("id", input.userId);

  if (error) throw error;
}

export async function listShopOwners(): Promise<AdminOwnerOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, surname")
    .eq("role", "shop_owner")
    .eq("is_suspended", false)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((owner) => ({
    id: owner.id,
    displayName: [owner.first_name, owner.surname].filter(Boolean).join(" ").trim() || owner.id,
  }));
}

export async function listShops(): Promise<AdminShopRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("laundry_shops")
    .select("id, owner_id, shop_name, description, location, cover_image_url, starting_price, load_capacity_kg, commission_percentage, is_verified, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createShop(input: {
  ownerId: string;
  shopName: string;
  location: string;
  description?: string;
  coverImageUrl?: string;
  startingPrice: number;
  loadCapacityKg: number;
  commissionPercentage: number;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("laundry_shops").insert({
    owner_id: input.ownerId,
    shop_name: input.shopName,
    location: input.location,
    description: input.description?.trim() || null,
    cover_image_url: input.coverImageUrl?.trim() || null,
    starting_price: input.startingPrice,
    load_capacity_kg: input.loadCapacityKg,
    price_per_kg: input.startingPrice,
    commission_percentage: input.commissionPercentage,
    is_verified: false,
  });

  if (error) throw error;
}

export async function updateShop(input: {
  shopId: string;
  ownerId: string;
  shopName: string;
  location: string;
  description?: string;
  coverImageUrl?: string;
  startingPrice: number;
  loadCapacityKg: number;
  commissionPercentage: number;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("laundry_shops")
    .update({
      owner_id: input.ownerId,
      shop_name: input.shopName,
      location: input.location,
      description: input.description?.trim() || null,
      cover_image_url: input.coverImageUrl?.trim() || null,
      starting_price: input.startingPrice,
      load_capacity_kg: input.loadCapacityKg,
      price_per_kg: input.startingPrice,
      commission_percentage: input.commissionPercentage,
    })
    .eq("id", input.shopId);

  if (error) throw error;
}

export async function deleteShop(shopId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("laundry_shops").delete().eq("id", shopId);

  if (error) throw error;
}

export async function listVouchers(): Promise<AdminVoucherRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vouchers")
    .select(
      "id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, is_active, starts_at, ends_at, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createAdminVoucher(input: {
  code: string;
  description?: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("vouchers").insert({
    code: input.code.toUpperCase(),
    description: input.description?.trim() || null,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    min_order_amount: input.minOrderAmount,
    max_discount_amount: input.maxDiscountAmount ?? null,
    is_active: true,
  });

  if (error) throw error;
}

export async function updateVoucher(input: {
  voucherId: string;
  code: string;
  description?: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  isActive: boolean;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vouchers")
    .update({
      code: input.code.toUpperCase(),
      description: input.description?.trim() || null,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      min_order_amount: input.minOrderAmount,
      max_discount_amount: input.maxDiscountAmount ?? null,
      is_active: input.isActive,
    })
    .eq("id", input.voucherId);

  if (error) throw error;
}

export async function deleteVoucher(voucherId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("vouchers").delete().eq("id", voucherId);

  if (error) throw error;
}

export async function toggleVoucher(voucherId: string, isActive: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vouchers")
    .update({ is_active: isActive })
    .eq("id", voucherId);

  if (error) throw error;
}
