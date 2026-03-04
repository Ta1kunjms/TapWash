import { createClient } from "@/lib/supabase/server";

export async function applyVoucher(code: string | undefined, subtotal: number) {
  if (!code) return { promoCode: null, discount: 0 };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vouchers")
    .select("code, discount_type, discount_value, min_order_amount, max_discount_amount, is_active, starts_at, ends_at")
    .eq("code", code.toUpperCase())
    .single();

  if (error || !data || !data.is_active) return { promoCode: null, discount: 0 };

  const now = Date.now();
  if (data.starts_at && now < new Date(data.starts_at).getTime()) return { promoCode: null, discount: 0 };
  if (data.ends_at && now > new Date(data.ends_at).getTime()) return { promoCode: null, discount: 0 };
  if (subtotal < Number(data.min_order_amount)) return { promoCode: null, discount: 0 };

  const rawDiscount =
    data.discount_type === "fixed"
      ? Number(data.discount_value)
      : (subtotal * Number(data.discount_value)) / 100;

  const maxDiscount = data.max_discount_amount ? Number(data.max_discount_amount) : rawDiscount;
  const discount = Math.min(rawDiscount, maxDiscount, subtotal);

  return { promoCode: data.code, discount: Number(discount.toFixed(2)) };
}

export async function createMockPaymentIntent(total: number, method: "cod" | "gcash" | "card") {
  if (method === "cod") return null;

  const reference = `PMT-${method.toUpperCase()}-${Date.now()}`;
  return {
    method,
    amount: total,
    reference,
    status: "pending_confirmation",
  };
}
