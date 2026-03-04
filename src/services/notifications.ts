import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/services/push";

export async function logOrderEvent(orderId: string, eventType: string, payload: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("order_events").insert({
    order_id: orderId,
    actor_id: user?.id ?? null,
    event_type: eventType,
    payload,
  });

  if (error) throw error;

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id")
    .eq("id", orderId)
    .single();

  if (order?.customer_id) {
    await sendPushToUser(order.customer_id, {
      title: "TapWash Order Update",
      body: `${eventType.replaceAll("_", " ")} for order ${order.id.slice(0, 8)}`,
      orderId,
    });
  }
}

export async function getOrderEvents(orderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_events")
    .select("id, event_type, payload, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}
