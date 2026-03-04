import { getDeliveryQuote } from "@/lib/delivery-quote";
import { z } from "zod";

const quoteSchema = z.object({
  pickupAddress: z.string().min(5),
  dropoffAddress: z.string().min(5),
  shopLocation: z.string().min(2),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = quoteSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid quote payload" }, { status: 400 });
  }

  const quote = await getDeliveryQuote(parsed.data);
  return Response.json(quote);
}
