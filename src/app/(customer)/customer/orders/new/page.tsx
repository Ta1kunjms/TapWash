import { BookingForm } from "@/components/customer/booking-form";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { getVerifiedShopsWithServices } from "@/services/shops";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; shopId?: string; error?: string }>;
}) {
  const { q, shopId, error } = await searchParams;
  const shops = await getVerifiedShopsWithServices(q);

  return (
    <main className="space-y-4 pb-2">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <FlaticonIcon name="cross-circle" className="text-base" />
            {error}
          </p>
        </div>
      ) : null}

      {shops.length > 0 ? (
        <BookingForm shops={shops} initialShopId={shopId} />
      ) : (
        <div className="rounded-[2rem] border border-border-muted/70 bg-white/95 p-5 shadow-soft">
          <p className="text-sm text-text-secondary">No verified shops yet. Please check again later.</p>
        </div>
      )}
    </main>
  );
}
