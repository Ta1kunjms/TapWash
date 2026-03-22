import { DeliveryTrackingPanel } from "@/components/customer/delivery-tracking-panel";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { ORDER_STATUS_STEPS } from "@/lib/constants";
import { getMyOrderTrackingDetails } from "@/services/orders";
import type { OrderStatus } from "@/types/domain";
import Link from "next/link";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  picked_up: "Picked Up",
  washing: "Washing",
  drying: "Drying",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function RequestTrackPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const tracking = await getMyOrderTrackingDetails(orderId);

  if (!tracking) {
    return (
      <main className="space-y-4">
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center text-rose-700">
          <h1 className="text-xl font-black">Request not found</h1>
          <p className="mt-2 text-sm">We could not load this tracking request.</p>
          <Link
            href="/customer/requests"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white"
          >
            Back to Requests
          </Link>
        </section>
      </main>
    );
  }

  const { order, delivery } = tracking;
  const statusStepIndex = Math.max(0, ORDER_STATUS_STEPS.indexOf(order.status as OrderStatus));
  const estimatedArrival = formatEta(order.etaMinutes ?? delivery.etaMinutes);
  const expectedDelivery = order.deliveryDate ? formatDateTime(order.deliveryDate) : "To be updated";
  const requestId = order.id.slice(0, 16).toUpperCase();
  const riderName = delivery.riderName ?? "Rider assignment in progress";
  const riderRole = "TapWash Rider";
  const riderPhoneHref = delivery.riderPhone ? `tel:${delivery.riderPhone}` : `tel:${order.paymentReference ?? ""}`;

  return (
    <main className="-mx-4 min-h-[84vh] overflow-hidden rounded-[1.4rem] border border-[#bdd8ea] bg-[#d9ebf8]">
      <header className="relative z-10 flex items-center gap-3 bg-[#c8dced] px-4 py-3 text-[#224d72]">
        <Link
          href="/customer/requests?tab=active"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-[#2f8ecf]"
          aria-label="Back to requests"
        >
          <FlaticonIcon name="angle-small-left" className="text-xl" />
        </Link>
        <div>
          <h1 className="text-base font-black">Track Laundry</h1>
          <p className="text-xs font-semibold text-[#3e7399]">{order.shopName}</p>
        </div>
      </header>

      <section
        className="relative h-[18.5rem] border-y border-[#b9d0e1] bg-[linear-gradient(180deg,#f1f4f8_0%,#d9dee3_100%)]"
        aria-label="Map"
      >
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.52) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.52) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-x-4 bottom-4 rounded-xl bg-white/90 px-3 py-2 text-[0.76rem] font-semibold text-[#2f5878] shadow-[0_8px_20px_rgba(35,63,99,0.18)]">
          {order.distanceKm !== null
            ? `Distance ${order.distanceKm.toFixed(1)} km · ETA ${estimatedArrival}`
            : `Estimated arrival ${estimatedArrival}`}
        </div>
      </section>

      <section className="relative -mt-3 rounded-t-[1.4rem] border-t border-[#d4e3ee] bg-white px-4 pb-6 pt-3 shadow-[0_-8px_24px_rgba(26,72,109,0.16)]">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-[#d6e2ec]" aria-hidden="true" />

        <div className="text-center">
          <p className="text-[0.78rem] font-black uppercase tracking-[0.12em] text-[#8aa8bf]">Estimated Arrival Time</p>
          <p className="mt-1 text-xl font-black text-[#178bd1]">{estimatedArrival}</p>
        </div>

        <section className="mt-4 rounded-[1rem] border border-[#d7e5f0] bg-[#f9fcff] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-full bg-[#d6ebfa]" aria-hidden="true" />
              <div>
                <p className="text-sm font-black text-[#2f5878]">{riderName}</p>
                <p className="text-xs font-semibold text-[#7f9db4]">{riderRole}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={riderPhoneHref}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ebf6ff] text-[#178bd1]"
                aria-label="Call rider"
              >
                <FlaticonIcon name="phone-call" className="text-sm" />
              </a>
              <Link
                href="/customer/notifications"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ebf6ff] text-[#178bd1]"
                aria-label="Chat rider"
              >
                <FlaticonIcon name="comment" className="text-sm" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-3 rounded-[1rem] border border-[#d7e5f0] bg-[#f9fcff] p-3">
          <p className="text-sm font-black text-[#2f5878]">{order.shopName}</p>
          <div className="mt-2 space-y-1.5 text-[0.78rem] font-semibold text-[#5d7e97]">
            <p className="flex items-start gap-2">
              <FlaticonIcon name="navigation" className="mt-0.5 text-sm text-[#178bd1]" />
              <span>{order.pickupAddress ?? (order.shopLocation || "Pickup location to be updated")}</span>
            </p>
            <p className="flex items-start gap-2">
              <FlaticonIcon name="marker" className="mt-0.5 text-sm text-[#178bd1]" />
              <span>{order.dropoffAddress ?? "Destination to be updated"}</span>
            </p>
          </div>
        </section>

        <section className="mt-4 border-t border-[#d9e6f0] pt-4">
          <h2 className="text-[0.9rem] font-black text-[#5e88aa]">Request Details</h2>
          <div className="mt-2 grid gap-1 text-[0.78rem] font-semibold text-[#7f9db4]">
            <p className="flex items-center justify-between gap-2">
              <span>Expected Delivery Date:</span>
              <span className="text-right text-[#4d7492]">{expectedDelivery}</span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span>Request ID No:</span>
              <span className="text-right text-[#4d7492]">{requestId}</span>
            </p>
          </div>

          <div className="mt-3 rounded-[0.95rem] border border-[#d9e8f3] bg-white px-3 py-2.5">
            <p className="flex items-center justify-between gap-2 text-[0.82rem] font-bold text-[#2f5878]">
              <span>{order.serviceName}</span>
              <span>₱{Number(order.totalPrice).toFixed(2)}</span>
            </p>
          </div>
        </section>

        <section className="mt-4 border-t border-[#d9e6f0] pt-4">
          <h2 className="text-[0.9rem] font-black text-[#5e88aa]">Request Status</h2>
          <div className="mt-2 space-y-2">
            {ORDER_STATUS_STEPS.map((step, index) => {
              const complete = order.status !== "cancelled" && index < statusStepIndex;
              const active = order.status !== "cancelled" && index === statusStepIndex;
              const pending = !complete && !active;

              return (
                <div key={step} className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex h-4 w-4 rounded-full border ${
                      complete
                        ? "border-[#1d94db] bg-[#1d94db]"
                        : active
                          ? "border-[#1d94db] bg-white"
                          : "border-[#c9d8e6] bg-white"
                    }`}
                    aria-hidden="true"
                  />
                  <p
                    className={`text-[0.8rem] font-semibold ${
                      active ? "text-[#1d94db]" : pending ? "text-[#8ba8be]" : "text-[#5f84a2]"
                    }`}
                  >
                    {STATUS_LABELS[step]}
                  </p>
                </div>
              );
            })}
            {order.status === "cancelled" ? <p className="text-[0.8rem] font-semibold text-rose-500">This request was cancelled.</p> : null}
          </div>
        </section>

        <section className="mt-4">
          <DeliveryTrackingPanel orderId={order.id} />
        </section>
      </section>
    </main>
  );
}

function formatEta(etaMinutes: number | null) {
  if (!etaMinutes || etaMinutes <= 0) {
    return "--:--";
  }

  const now = new Date();
  const arrival = new Date(now.getTime() + etaMinutes * 60 * 1000);
  const hours = String(arrival.getHours()).padStart(2, "0");
  const minutes = String(arrival.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
