import { MobileTopBar } from "@/components/customer/mobile-chrome";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { getCustomerDictionary } from "@/lib/i18n";
import { getSelectedCustomerAddress } from "@/services/addresses";
import { getCustomerProfile, getInitials } from "@/services/customer";
import { getUnreadNotificationCount } from "@/services/notifications";
import { getMyOrders } from "@/services/orders";
import Link from "next/link";

type TabKey = "active" | "completed" | "cancelled";

const activeStatuses = ["pending", "accepted", "picked_up", "washing", "drying", "ready", "out_for_delivery"];

export default async function CustomerRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; booked?: string; orderId?: string }>;
}) {
  const { tab, booked, orderId } = await searchParams;
  const selectedTab: TabKey = tab === "completed" || tab === "cancelled" ? tab : "active";
  const justBooked = booked === "1";

  const [orders, profile, selectedAddress, notificationCount] = await Promise.all([
    getMyOrders(),
    getCustomerProfile(),
    getSelectedCustomerAddress(),
    getUnreadNotificationCount(),
  ]);
  const dictionary = getCustomerDictionary(profile?.preferred_language ?? "en");
  const tabConfig: { key: TabKey; label: string }[] = [
    { key: "active", label: dictionary.requests.active },
    { key: "completed", label: dictionary.requests.completed },
    { key: "cancelled", label: dictionary.requests.cancelled },
  ];
  const profileInitials = getInitials(profile?.first_name ?? null, profile?.surname ?? null) || "TW";
  const locationLabel = selectedAddress?.address_line?.trim() || profile?.address?.trim() || dictionary.home.setLocationLabel;
  const filteredOrders = orders.filter((order) => {
    if (selectedTab === "completed") return order.status === "completed";
    if (selectedTab === "cancelled") return order.status === "cancelled";
    return activeStatuses.includes(order.status);
  });
  const prioritizedOrders = orderId
    ? [...filteredOrders].sort((a, b) => {
        if (a.id === orderId && b.id !== orderId) return -1;
        if (b.id === orderId && a.id !== orderId) return 1;
        return 0;
      })
    : filteredOrders;

  return (
    <main className="space-y-4">
      <MobileTopBar
        searchPlaceholder={dictionary.requests.searchPlaceholder}
        searchAction="/customer/requests"
        locationLabel={locationLabel}
        profileInitials={profileInitials}
        profileAvatarKey={profile?.avatar_key}
        notificationCount={notificationCount}
      />

      {justBooked ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <FlaticonIcon name="check" className="text-base" />
            {dictionary.requests.bookingConfirmed}
          </p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-border-muted bg-background-app/50 pb-4 pt-2">
        <div className="grid grid-cols-3 border-b border-border-muted px-2">
          {tabConfig.map((tabItem) => {
            const active = selectedTab === tabItem.key;
            return (
              <Link
                key={tabItem.key}
                href={`/customer/requests?tab=${tabItem.key}`}
                className={`relative px-2 py-3 text-center text-sm font-semibold ${active ? "text-primary-500" : "text-text-muted"}`}
              >
                {tabItem.label}
                {active && <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-primary-500" />}
              </Link>
            );
          })}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-500/30 text-primary-500">
              <FlaticonIcon name="question" className="text-5xl" />
            </div>
            <p className="mx-auto max-w-xs text-base font-semibold text-primary-500/70">
              {dictionary.requests.emptyStateBody}
            </p>
            <Link
              href="/customer/orders/new"
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white"
            >
              {dictionary.requests.bookLaundry}
            </Link>
          </div>
        ) : (
          <div className="space-y-3 px-3 pt-3">
            {prioritizedOrders.map((order) => {
              const isFocusedOrder = orderId === order.id;

              return (
                <article
                  key={order.id}
                  className={`rounded-2xl border bg-white p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                    isFocusedOrder ? "border-emerald-300 ring-2 ring-emerald-200" : "border-border-muted"
                  }`}
                >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-text-secondary">
                      {(Array.isArray(order.laundry_shops) ? order.laundry_shops[0]?.shop_name : undefined) ?? dictionary.requests.laundryShopFallback}
                    </h2>
                    <p className="text-xs text-text-muted">{dictionary.requests.refPrefix} {order.id.slice(0, 8)}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {isFocusedOrder ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">{dictionary.requests.justBooked}</span>
                    ) : null}
                    <span className="rounded-full bg-primary-500/10 px-2 py-1 text-xs font-semibold capitalize text-primary-500">
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-text-secondary">{dictionary.requests.pickupPrefix} {new Date(order.pickup_date).toLocaleString()}</p>
                <p className="mt-1 text-xs text-text-muted">{dictionary.requests.totalPrefix} ₱{order.total_price} · {dictionary.requests.paymentPrefix} {order.payment_method}</p>
                <Link
                  href={`/customer/requests/${encodeURIComponent(order.id)}`}
                  className="mt-3 inline-flex h-9 items-center rounded-xl bg-primary-500 px-3 text-xs font-semibold text-white"
                >
                  {dictionary.requests.trackLaundry}
                </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
