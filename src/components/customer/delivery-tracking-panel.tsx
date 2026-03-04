import { DeliveryMap } from "@/components/customer/delivery-map";
import { createClient } from "@/lib/supabase/server";

export async function DeliveryTrackingPanel({ orderId }: { orderId: string }) {
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

  return <DeliveryMap orderId={orderId} initial={{ location, delivery }} />;
}
