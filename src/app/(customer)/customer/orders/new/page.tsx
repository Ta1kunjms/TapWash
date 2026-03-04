import { BookingForm } from "@/components/customer/booking-form";
import { Card } from "@/components/ui/card";
import { getVerifiedShopsWithServices } from "@/services/shops";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const shops = await getVerifiedShopsWithServices(q);

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Book Laundry</h1>
      <Card>
        {shops.length > 0 ? (
          <BookingForm shops={shops} />
        ) : (
          <p className="text-sm text-text-secondary">No verified shops yet. Please check again later.</p>
        )}
      </Card>
    </main>
  );
}
