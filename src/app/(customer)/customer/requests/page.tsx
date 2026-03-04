import { MobileTopBar } from "@/components/customer/mobile-chrome";
import { getMyOrders } from "@/services/orders";
import Link from "next/link";

type TabKey = "active" | "completed" | "cancelled";

const tabConfig: { key: TabKey; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const activeStatuses = ["pending", "accepted", "picked_up", "washing", "drying", "ready", "out_for_delivery"];

export default async function CustomerRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const selectedTab: TabKey = tab === "completed" || tab === "cancelled" ? tab : "active";

  const orders = await getMyOrders();
  const filteredOrders = orders.filter((order) => {
    if (selectedTab === "completed") return order.status === "completed";
    if (selectedTab === "cancelled") return order.status === "cancelled";
    return activeStatuses.includes(order.status);
  });

  return (
    <main className="space-y-4">
      <MobileTopBar searchPlaceholder="Find requests..." searchAction="/customer/requests" />

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
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-500/30 text-5xl text-primary-500">
              ?
            </div>
            <p className="mx-auto max-w-xs text-base font-semibold text-primary-500/70">
              Your past and pending requests will appear here once booked.
            </p>
          </div>
        ) : (
          <div className="space-y-3 px-3 pt-3">
            {filteredOrders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-border-muted bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-text-secondary">
                      {(Array.isArray(order.laundry_shops) ? order.laundry_shops[0]?.shop_name : undefined) ?? "Laundry Shop"}
                    </h2>
                    <p className="text-xs text-text-muted">Ref: {order.id.slice(0, 8)}</p>
                  </div>
                  <span className="rounded-full bg-primary-500/10 px-2 py-1 text-xs font-semibold capitalize text-primary-500">
                    {order.status.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-secondary">Pickup: {new Date(order.pickup_date).toLocaleString()}</p>
                <p className="mt-1 text-xs text-text-muted">Total: ₱{order.total_price} · Payment: {order.payment_method}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
