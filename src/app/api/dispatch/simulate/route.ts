import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const simulateSchema = z.object({
  orderId: z.uuid(),
  riderId: z.uuid(),
  startLat: z.number(),
  startLng: z.number(),
  targetLat: z.number(),
  targetLng: z.number(),
});

function jitter() {
  return (Math.random() - 0.5) * 0.00035;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return Response.json({ error: "Unable to load profile" }, { status: 500 });
  }

  if (!profile || profile.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = simulateSchema.safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: "Invalid simulation payload" }, { status: 400 });
  }

  const { orderId, riderId, startLat, startLng, targetLat, targetLng } = parsed.data;

  const { data: current } = await supabase
    .from("rider_locations")
    .select("lat, lng")
    .eq("order_id", orderId)
    .maybeSingle();

  const currentLat = Number(current?.lat ?? startLat);
  const currentLng = Number(current?.lng ?? startLng);

  const nextLatRaw = currentLat + (targetLat - currentLat) * 0.24 + jitter();
  const nextLngRaw = currentLng + (targetLng - currentLng) * 0.24 + jitter();

  const closeEnough = Math.abs(targetLat - currentLat) < 0.0008 && Math.abs(targetLng - currentLng) < 0.0008;
  const nextLat = closeEnough ? targetLat : Number(nextLatRaw.toFixed(6));
  const nextLng = closeEnough ? targetLng : Number(nextLngRaw.toFixed(6));

  const { error: locationError } = await supabase.from("rider_locations").upsert(
    {
      order_id: orderId,
      rider_id: riderId,
      lat: nextLat,
      lng: nextLng,
      updated_at: new Date().toISOString(),
      speed_kph: closeEnough ? 0 : 22,
      heading: closeEnough ? null : 90,
    },
    { onConflict: "order_id" },
  );

  if (locationError) {
    return Response.json({ error: locationError.message }, { status: 400 });
  }

  await supabase
    .from("deliveries")
    .update({ status: closeEnough ? "delivered" : "in_transit" })
    .eq("order_id", orderId);

  if (closeEnough) {
    await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId);
  }

  await supabase.from("order_events").insert({
    order_id: orderId,
    event_type: closeEnough ? "simulated_delivery_completed" : "simulated_rider_location",
    payload: {
      lat: nextLat,
      lng: nextLng,
      closeEnough,
    },
  });

  return Response.json({
    ok: true,
    lat: nextLat,
    lng: nextLng,
    closeEnough,
  });
}
