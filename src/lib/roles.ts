import type { UserRole } from "@/types/domain";

export function roleToPath(role: UserRole) {
  if (role === "admin") return "/admin";
  if (role === "shop_owner") return "/shop";
  return "/customer";
}
