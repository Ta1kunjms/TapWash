import { Card } from "@/components/ui/card";
import { formatOptionPriceDelta, formatServiceRateLabel } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";

export default async function ShopServicesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select(
      "id, name, description, pricing_model, unit_price, load_capacity_kg, service_option_groups(id, name, service_options(id, name, price_delta, price_type))",
    )
    .order("name");

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Manage Services</h1>
      {(data ?? []).map((service) => (
        <Card key={service.id}>
          <p className="font-semibold">{service.name}</p>
          {service.description ? <p className="mt-1 text-sm text-text-secondary">{service.description}</p> : null}
          <p className="mt-1 text-sm text-text-secondary">
            {formatServiceRateLabel(
              {
                id: service.id,
                name: service.name,
                pricing_model: service.pricing_model,
                unit_price: service.unit_price,
                load_capacity_kg: service.load_capacity_kg,
              },
            )}
          </p>
          {(service.service_option_groups ?? []).length > 0 ? (
            <div className="mt-3 space-y-2">
              {(service.service_option_groups ?? []).map((group) => (
                <div key={group.id}>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">{group.name}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {(group.service_options ?? []).map((option) => (
                      <span key={option.id} className="rounded-full bg-background-app px-2 py-1 text-xs font-semibold text-text-secondary">
                        {option.name} · {formatOptionPriceDelta(option)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      ))}
    </main>
  );
}
