import { CheckoutForm } from "@/components/customer/checkout-form";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { roleToPath } from "@/lib/roles";
import { listCustomerAddresses, getSelectedCustomerAddress } from "@/services/addresses";
import { getCurrentUserRole } from "@/services/auth";
import { getVerifiedShopsWithServices } from "@/services/shops";
import { redirect } from "next/navigation";
import { getCustomerProfile, getDefaultCustomerPaymentMethod } from "@/services/customer";

type CheckoutBucketSelection = {
  serviceId: string;
  loads: number;
  selectedOptionIds?: string[];
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; shopId?: string; serviceId?: string; weight?: string; promoCode?: string; error?: string; errorDetail?: string; bucket?: string }>;
}) {
  const role = await getCurrentUserRole();
  if (!role) redirect("/login");
  if (role !== "customer") redirect(roleToPath(role));

  const { q, shopId, serviceId, weight, promoCode, error, errorDetail, bucket } = await searchParams;
  const [selectedAddress, savedAddresses, profile, defaultPaymentMethod] = await Promise.all([
    getSelectedCustomerAddress(),
    listCustomerAddresses(),
    getCustomerProfile(),
    getDefaultCustomerPaymentMethod(),
  ]);
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
      {loadError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <FlaticonIcon name="info" className="text-base" />
            {loadError}
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <FlaticonIcon name="triangle-warning" className="text-base" />
            {error}
          </p>
          {errorDetail ? <p className="mt-1 text-xs font-medium text-rose-600/90">Details: {errorDetail}</p> : null}
        </div>
      ) : null}

      <CheckoutForm
        shops={shops}
        initialShopId={shopId}
        initialServiceId={serviceId}
        initialWeight={weight ? Number(weight) : undefined}
        initialBucket={initialBucket}
        initialPromoCode={promoCode}
        initialSelectedAddress={selectedAddress ? {
          addressLine: selectedAddress.address_line,
          lat: selectedAddress.lat,
          lng: selectedAddress.lng,
        } : null}
        initialSavedAddresses={savedAddresses.map((address) => address.address_line)}
        initialContactPhone={profile?.phone || ""}
        initialPaymentMethod={defaultPaymentMethod ?? "cod"}
      />
    </main>
  );
}

function parseBucketSelections(value?: string): CheckoutBucketSelection[] {
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
        (entry): entry is CheckoutBucketSelection =>
          Boolean(entry) &&
          typeof entry === "object" &&
          typeof (entry as CheckoutBucketSelection).serviceId === "string" &&
          typeof (entry as CheckoutBucketSelection).loads === "number",
      )
      .map((entry) => ({
        serviceId: entry.serviceId,
        loads: Math.max(1, Math.round(entry.loads)),
        selectedOptionIds: Array.isArray(entry.selectedOptionIds)
          ? entry.selectedOptionIds.filter((optionId): optionId is string => typeof optionId === "string")
          : [],
      }));
  } catch {
    return [];
  }
}
