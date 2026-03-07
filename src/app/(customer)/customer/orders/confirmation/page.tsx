import Link from "next/link";
import { OrderStepper } from "@/components/customer/order-stepper";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const shortRef = orderId?.slice(0, 8).toUpperCase() ?? "PENDING";

  return (
    <main className="space-y-4 pb-3">
      <OrderStepper currentStep={3} />

      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-center shadow-soft">
        <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white">
          <FlaticonIcon name="check" className="text-2xl" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">Booking Confirmed</p>
        <h1 className="mt-1 text-2xl font-black text-emerald-800">Your laundry request is in</h1>
        <p className="mt-2 text-sm text-emerald-800/80">Reference: #{shortRef}</p>
      </section>

      <section className="rounded-3xl border border-border-muted/70 bg-white p-4 shadow-soft">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-primary-500/70">What happens next</h2>
        <ul className="mt-3 space-y-2 text-sm text-text-secondary">
          <li>Shop receives your request and confirms pickup.</li>
          <li>Rider assignment and ETA will appear in requests.</li>
          <li>You can track status updates in real time.</li>
        </ul>
      </section>

      <div className="grid gap-3">
        <Link
          href={`/customer/requests?tab=active&booked=1${orderId ? `&orderId=${encodeURIComponent(orderId)}` : ""}`}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary-500 px-4 text-sm font-semibold text-white"
        >
          Track My Order
        </Link>
        <Link
          href="/customer/orders/new"
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-border-muted bg-white px-4 text-sm font-semibold text-primary-500"
        >
          Book Another Laundry
        </Link>
      </div>
    </main>
  );
}
