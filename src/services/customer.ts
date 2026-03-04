import { createClient } from "@/lib/supabase/server";

export type CustomerProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
};

export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, surname, phone, address")
    .eq("id", user.id)
    .single<{ first_name: string | null; surname: string | null; phone: string | null; address: string | null }>();

  const fullName = [profile?.first_name, profile?.surname].filter(Boolean).join(" ").trim() || "Customer";

  return {
    id: user.id,
    email: user.email ?? "",
    fullName,
    phone: profile?.phone ?? "",
    address: profile?.address ?? "Brgy. Tambler, GSC",
  };
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
