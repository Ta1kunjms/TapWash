import { geocodeAddress } from "@/lib/delivery-quote";
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
  const token = process.env.MAPBOX_ACCESS_TOKEN;

  if (token) {
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?limit=1&access_token=${token}`;
    const response = await fetch(endpoint, { cache: "no-store" });

    if (response.ok) {
      const body = (await response.json()) as {
        features?: Array<{ place_name?: string }>;
      };

      const placeName = body.features?.[0]?.place_name;
      if (placeName) {
        return Response.json({
          address: placeName,
          coordinates: { lat, lng },
        });
      }
    }
  }

  // Keep fallback deterministic when map providers are unavailable.
  const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}, General Santos City`;
  const stableCoords = await geocodeAddress(fallback);

  return Response.json({
    address: fallback,
    coordinates: stableCoords,
  });
}
