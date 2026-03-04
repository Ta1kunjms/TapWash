import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ShopServicesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("services").select("id, name, price_per_kg").order("name");

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Manage Services</h1>
      {(data ?? []).map((service) => (
        <Card key={service.id}>
          <p className="font-semibold">{service.name}</p>
          <p className="text-sm text-text-secondary">₱{service.price_per_kg}/kg</p>
        </Card>
      ))}
    </main>
  );
}
