import { ConfirmationTrackTransition } from "@/components/customer/confirmation-track-transition";
import { OrderStepper } from "@/components/customer/order-stepper";
import { getMyOrderTrackingDetails } from "@/services/orders";

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  if (!orderId) {
    return (
      <main className="space-y-4 pb-3">
        <OrderStepper currentStep={3} />
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-center text-rose-700 shadow-soft">
          <h1 className="text-xl font-black">Missing booking reference</h1>
          <p className="mt-2 text-sm">We could not load your booking details. Please return to your requests list.</p>
        </section>
      </main>
    );
  }

  const tracking = await getMyOrderTrackingDetails(orderId);

  if (!tracking) {
    return (
      <main className="space-y-4 pb-3">
        <OrderStepper currentStep={3} />
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-center text-rose-700 shadow-soft">
          <h1 className="text-xl font-black">Booking not found</h1>
          <p className="mt-2 text-sm">This request may have been removed or is no longer available.</p>
        </section>
      </main>
    );
  }

  const { order } = tracking;
  const canCancel = order.status === "pending" || order.status === "accepted";
  const checkoutHref = `/customer/orders/checkout?shopId=${encodeURIComponent(order.shopId)}&serviceId=${encodeURIComponent(order.serviceId)}`;
  const trackHref = `/customer/requests/${encodeURIComponent(order.id)}`;

  return (
    <main className="space-y-4 pb-3">
      <OrderStepper currentStep={3} />
      <ConfirmationTrackTransition
        orderId={order.id}
        shopName={order.shopName}
        checkoutHref={checkoutHref}
        trackHref={trackHref}
        canCancel={canCancel}
      />
    </main>
  );
}
