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

export async function getMyNotificationFeed(limit = 30) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_events")
    .select("id, event_type, payload, created_at, orders(id, status, laundry_shops(shop_name))")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getUnreadNotificationCount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("notification_last_read_at")
    .eq("id", user.id)
    .maybeSingle<{ notification_last_read_at: string | null }>();

  if (profileError) throw profileError;

  const lastReadAt = profile?.notification_last_read_at;
  if (!lastReadAt) return 0;

  const { count, error } = await supabase
    .from("order_events")
    .select("id", { count: "exact", head: true })
    .gt("created_at", lastReadAt);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationsReadNow() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update({ notification_last_read_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) throw error;
}
