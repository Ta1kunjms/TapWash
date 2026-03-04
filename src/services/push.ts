import { createClient } from "@/lib/supabase/server";

type StoredPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type PushPayload = {
  title: string;
  body: string;
  orderId?: string;
};

async function getWebPush() {
  if (!process.env.WEB_PUSH_PRIVATE_KEY || !process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY) {
    return null;
  }

  const webPushModule = await import("web-push");
  webPushModule.default.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT ?? "mailto:support@tapwash.app",
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
    process.env.WEB_PUSH_PRIVATE_KEY,
  );
  return webPushModule.default;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const webPush = await getWebPush();
  if (!webPush) return;

  const supabase = await createClient();
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("user_id", userId);

  if (error || !subscriptions || subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (row) => {
      const subscription = row.subscription as StoredPushSubscription;
      if (!subscription?.endpoint || !subscription?.keys?.auth || !subscription?.keys?.p256dh) {
        return;
      }

      try {
        await webPush.sendNotification(
          subscription,
          JSON.stringify(payload),
        );
      } catch {
        return;
      }
    }),
  );
}

export async function savePushSubscription(subscription: StoredPushSubscription) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const endpoint = String(subscription.endpoint ?? "");
  if (!endpoint) throw new Error("Invalid subscription");

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      subscription,
    },
    { onConflict: "endpoint" },
  );

  if (error) throw error;
}
