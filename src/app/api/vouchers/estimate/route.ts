import { applyVoucher } from "@/services/checkout";
import { z } from "zod";

const voucherEstimateSchema = z.object({
  code: z.string().trim().min(1).max(64),
  subtotal: z.number().min(0),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = voucherEstimateSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid voucher estimate payload" }, { status: 400 });
  }

  try {
    const result = await applyVoucher(parsed.data.code, parsed.data.subtotal);
    return Response.json(result);
  } catch {
    return Response.json({ promoCode: null, discount: 0 }, { status: 200 });
  }
}
