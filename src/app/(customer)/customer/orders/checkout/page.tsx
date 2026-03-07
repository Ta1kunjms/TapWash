import { CheckoutForm } from "@/components/customer/checkout-form";
import { getVerifiedShopsWithServices } from "@/services/shops";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; shopId?: string; serviceId?: string; weight?: string; promoCode?: string; error?: string }>;
}) {
  const { q, shopId, serviceId, weight, promoCode } = await searchParams;
  const shops = await getVerifiedShopsWithServices(q);

  return (
    <main className="space-y-4 pb-2">
      <CheckoutForm
        shops={shops}
        initialShopId={shopId}
        initialServiceId={serviceId}
        initialWeight={Number(weight ?? 3)}
        initialPromoCode={promoCode}
      />
    </main>
  );
}
