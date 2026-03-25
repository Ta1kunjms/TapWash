import { DeliveryMap } from "@/components/customer/delivery-map";
import { createClient } from "@/lib/supabase/server";

type OrderTrackingCoordinates = {
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
};

export async function DeliveryTrackingPanel({ orderId, coordinates }: { orderId: string; coordinates: OrderTrackingCoordinates }) {
  const supabase = await createClient();

  const [{ data: location }, { data: delivery }] = await Promise.all([
    supabase
      .from("rider_locations")
      .select("lat, lng, updated_at")
      .eq("order_id", orderId)
      .maybeSingle(),
    supabase
      .from("deliveries")
      .select("status, eta_minutes")
      .eq("order_id", orderId)
      .maybeSingle(),
  ]);

  return (
    <DeliveryMap
      orderId={orderId}
      pickupLat={coordinates.pickupLat}
      pickupLng={coordinates.pickupLng}
      dropoffLat={coordinates.dropoffLat}
      dropoffLng={coordinates.dropoffLng}
      initial={{ location, delivery }}
    />
  );
}
