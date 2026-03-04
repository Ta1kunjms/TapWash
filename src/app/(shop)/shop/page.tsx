import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ShopDashboardPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_price")
    .order("created_at", { ascending: false })
    .limit(10);

  const revenue = (orders ?? []).reduce((sum, order) => sum + Number(order.total_price), 0);

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Shop Dashboard</h1>
      <Card>
        <p className="text-sm text-text-secondary">Latest 10 orders revenue</p>
        <p className="text-2xl font-bold">₱{revenue.toFixed(2)}</p>
      </Card>
    </main>
  );
}
