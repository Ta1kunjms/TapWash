import { BookingForm } from "@/components/customer/booking-form";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { roleToPath } from "@/lib/roles";
import { getCurrentUserRole } from "@/services/auth";
import { getVerifiedShopsWithServices } from "@/services/shops";
import { redirect } from "next/navigation";

type BookingBucketSelection = {
  serviceId: string;
  loads: number;
  selectedOptionIds?: string[];
};

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; shopId?: string; serviceId?: string; bucket?: string; error?: string }>;
}) {
  const role = await getCurrentUserRole();
  if (!role) redirect("/login");
  if (role !== "customer") redirect(roleToPath(role));

  const { q, shopId, serviceId, bucket, error } = await searchParams;
  let shops: Awaited<ReturnType<typeof getVerifiedShopsWithServices>> = [];
  let loadError: string | null = null;

  try {
    shops = await getVerifiedShopsWithServices(q, { shopId, limit: shopId ? 1 : 40 });
  } catch {
    loadError = "Shops are taking too long to load right now. Please try again.";
  }
  const initialBucket = parseBucketSelections(bucket);

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

      {loadError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <FlaticonIcon name="info" className="text-base" />
            {loadError}
          </p>
        </div>
      ) : null}

      {shops.length > 0 ? (
        <BookingForm
          shops={shops}
          initialShopId={shopId}
          initialServiceId={serviceId}
          initialBucket={initialBucket}
        />
      ) : (
        <div className="rounded-[2rem] border border-border-muted/70 bg-white/95 p-5 shadow-soft">
          <p className="text-sm text-text-secondary">No verified shops yet. Please check again later.</p>
        </div>
      )}
    </main>
  );
}

function parseBucketSelections(value?: string): BookingBucketSelection[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (entry): entry is BookingBucketSelection =>
          Boolean(entry) &&
          typeof entry === "object" &&
          typeof (entry as BookingBucketSelection).serviceId === "string" &&
          typeof (entry as BookingBucketSelection).loads === "number",
      )
      .map((entry) => ({
        serviceId: entry.serviceId,
        loads: Math.max(0, Math.min(20, Math.round(entry.loads))),
        selectedOptionIds: Array.isArray(entry.selectedOptionIds)
          ? entry.selectedOptionIds.filter((optionId): optionId is string => typeof optionId === "string")
          : [],
      }))
      .filter((entry) => entry.loads > 0);
  } catch {
    return [];
  }
}
