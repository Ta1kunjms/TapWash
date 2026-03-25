import { toggleShopFavorite } from "@/services/favorites";
import { z } from "zod";

const payloadSchema = z.object({
  shopId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid favorite payload" }, { status: 400 });
    }

    const isFavorite = await toggleShopFavorite(parsed.data.shopId);
    return Response.json({ isFavorite });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
