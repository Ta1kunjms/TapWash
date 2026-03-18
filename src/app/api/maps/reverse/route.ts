import { reverseGeocode } from "@/lib/geocoding";
import { z } from "zod";

const reverseSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = reverseSchema.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
  });

  if (!parsed.success) {
    return Response.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const { lat, lng } = parsed.data;
  const resolved = await reverseGeocode(lat, lng);
  if (resolved) {
    return Response.json(resolved);
  }

  const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  return Response.json({
    address: fallback,
    coordinates: { lat, lng },
  });
}
