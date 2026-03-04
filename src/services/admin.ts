import { createClient } from "@/lib/supabase/server";

export async function verifyShop(shopId: string, isVerified: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("laundry_shops")
    .update({ is_verified: isVerified })
    .eq("id", shopId);

  if (error) throw error;
}

export async function listUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_suspended, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function setUserSuspended(userId: string, isSuspended: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_suspended: isSuspended })
    .eq("id", userId);

  if (error) throw error;
}
