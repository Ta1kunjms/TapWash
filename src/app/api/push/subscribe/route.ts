import { savePushSubscription } from "@/services/push";
import { z } from "zod";

const subscribeSchema = z.object({
  endpoint: z.url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    await savePushSubscription(parsed.data);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    if (message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
