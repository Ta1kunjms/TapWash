import { DeliveryQuoteError, getDeliveryQuote } from "@/lib/delivery-quote";
import { z } from "zod";

const optionalCoordinate = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.number().optional(),
);

const quoteSchema = z.object({
  pickupAddress: z.string().min(5),
  dropoffAddress: z.string().min(5),
  shopLocation: z.string().min(2),
  pickupLat: optionalCoordinate.pipe(z.number().min(-90).max(90).optional()),
  pickupLng: optionalCoordinate.pipe(z.number().min(-180).max(180).optional()),
  dropoffLat: optionalCoordinate.pipe(z.number().min(-90).max(90).optional()),
  dropoffLng: optionalCoordinate.pipe(z.number().min(-180).max(180).optional()),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = quoteSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid quote payload" }, { status: 400 });
  }

  try {
    const quote = await getDeliveryQuote(parsed.data);
    return Response.json(quote);
  } catch (error) {
    if (error instanceof DeliveryQuoteError) {
      switch (error.code) {
        case "INVALID_INPUT":
          return Response.json({ error: error.message }, { status: 400 });
        case "UNRESOLVED_PICKUP":
        case "UNRESOLVED_DROPOFF":
        case "UNRESOLVED_SHOP":
          return Response.json({ error: error.message }, { status: 422 });
        case "OUTSIDE_SERVICE_AREA":
          return Response.json({ error: error.message }, { status: 422 });
        case "MISSING_API_KEY":
          return Response.json({ error: error.message }, { status: 500 });
        case "ROUTE_UNAVAILABLE":
          return Response.json({ error: error.message }, { status: 503 });
        default:
          return Response.json({ error: "Unable to calculate quote right now." }, { status: 502 });
      }
    }

    const message = error instanceof Error ? error.message : "Unable to calculate quote";
    return Response.json({ error: message }, { status: 502 });
  }
}
