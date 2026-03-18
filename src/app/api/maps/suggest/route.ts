import { suggestAddresses } from "@/lib/geocoding";
import { z } from "zod";

const suggestQuerySchema = z.object({
  q: z.string().trim().min(3),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  if (query.length < 3) {
    return Response.json({ suggestions: [] });
  }

  const parsed = suggestQuerySchema.safeParse({
    q: query,
    lat: url.searchParams.get("lat") ?? undefined,
    lng: url.searchParams.get("lng") ?? undefined,
  });

  if (!parsed.success) {
    return Response.json({ suggestions: [] });
  }

  const proximity =
    typeof parsed.data.lat === "number" && typeof parsed.data.lng === "number"
      ? { lat: parsed.data.lat, lng: parsed.data.lng }
      : null;

  const suggestions = await suggestAddresses(parsed.data.q, {
    proximity,
    countryCodes: ["ph"],
    limit: 6,
  });
  return Response.json({ suggestions });
}
