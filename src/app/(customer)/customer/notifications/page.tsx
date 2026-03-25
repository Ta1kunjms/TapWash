import { MobileTopBar } from "@/components/customer/mobile-chrome";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { getCustomerProfile, getInitials } from "@/services/customer";
import { getMyNotificationFeed, markNotificationsReadNow } from "@/services/notifications";
import Link from "next/link";

function toReadableEvent(eventType: string) {
  return eventType.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function shopNameFromEvent(event: {
  orders:
    | {
        laundry_shops: { shop_name: string } | { shop_name: string }[] | null;
      }
    | {
        laundry_shops: { shop_name: string } | { shop_name: string }[] | null;
      }[]
    | null;
}) {
  const ordersValue = event.orders;
  const order = Array.isArray(ordersValue) ? ordersValue[0] : ordersValue;
  const shopsValue = order?.laundry_shops;
  if (!shopsValue) return "Laundry Shop";
  if (Array.isArray(shopsValue)) return shopsValue[0]?.shop_name ?? "Laundry Shop";
  return shopsValue.shop_name;
}

function orderMetaFromEvent(event: {
  orders:
    | {
        id?: string;
        status?: string;
      }
    | {
        id?: string;
        status?: string;
      }[]
    | null;
}) {
  const ordersValue = event.orders;
  const order = Array.isArray(ordersValue) ? ordersValue[0] : ordersValue;
  return {
    id: typeof order?.id === "string" ? order.id : null,
    status: typeof order?.status === "string" ? order.status : null,
  };
}

function tabFromStatus(status: string | null) {
  if (!status) return "active";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "active";
}

export default async function CustomerNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [profile, events] = await Promise.all([getCustomerProfile(), getMyNotificationFeed(40)]);
  await markNotificationsReadNow();
  const profileInitials = getInitials(profile?.first_name ?? null, profile?.surname ?? null) || "TW";
  const locationLabel = profile?.address?.trim() || "Set location";

  const normalizedQuery = q?.trim().toLowerCase() ?? "";
  const filteredEvents = normalizedQuery
    ? events.filter((event) => {
        const shopName = shopNameFromEvent(event).toLowerCase();
        const eventLabel = toReadableEvent(event.event_type).toLowerCase();
        return shopName.includes(normalizedQuery) || eventLabel.includes(normalizedQuery);
      })
    : events;

  const grouped = new Map<string, typeof filteredEvents>();
  for (const event of filteredEvents) {
    const date = new Date(event.created_at);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const label = isToday
      ? "Today"
      : isYesterday
        ? "Yesterday"
        : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

    const list = grouped.get(label) ?? [];
    list.push(event);
    grouped.set(label, list);
  }

  return (
    <main className="space-y-4">
      <MobileTopBar
        searchPlaceholder="Search notifications..."
        searchAction="/customer/notifications"
        searchValue={q}
        locationLabel={locationLabel}
        profileInitials={profileInitials}
        profileAvatarKey={profile?.avatar_key}
        notificationCount={0}
        liveNotificationCount={false}
      />

      <section className="space-y-1">
        <h1 className="text-3xl font-black text-primary-500">Notifications</h1>
        <p className="text-sm text-text-secondary/70">Latest updates about your orders and delivery progress.</p>
      </section>

      {filteredEvents.length === 0 ? (
        <section className="rounded-2xl border border-border-muted bg-background-app/40 px-4 py-12 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-500/20 text-primary-500">
            <FlaticonIcon name="bell" className="text-4xl" />
          </div>
          <p className="text-base font-semibold text-primary-500/80">No updates yet</p>
          <p className="mt-1 text-sm text-text-muted">Your order activity will appear here once you start booking.</p>
        </section>
      ) : (
        <section className="space-y-4 pb-2">
          {Array.from(grouped.entries()).map(([label, groupedEvents]) => (
            <div key={label} className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">{label}</h2>
              <div className="space-y-2">
                {groupedEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={(() => {
                      const meta = orderMetaFromEvent(event);
                      const tab = tabFromStatus(meta.status);
                      const params = new URLSearchParams({ tab });
                      if (meta.id) {
                        params.set("orderId", meta.id);
                      }
                      return `/customer/requests?${params.toString()}`;
                    })()}
                    className="block rounded-2xl border border-border-muted bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-secondary">{toReadableEvent(event.event_type)}</p>
                        <p className="mt-0.5 text-xs text-text-muted">{shopNameFromEvent(event)}</p>
                      </div>
                      <span className="text-[11px] font-medium text-text-muted">{new Date(event.created_at).toLocaleTimeString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
