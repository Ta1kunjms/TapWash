import { roleToPath } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export async function getCurrentUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: UserRole }>();

  return data?.role ?? null;
}

export { roleToPath };
