import { Card } from "@/components/ui/card";
import { updateOrderStatusAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { getAllowedNextStatuses } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/domain";

export default async function ShopOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, total_price, pickup_date")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Shop Orders</h1>
      {(orders ?? []).map((order) => (
        <Card key={order.id}>
          <p className="font-semibold">{order.status}</p>
          <p className="text-sm text-text-secondary">₱{order.total_price}</p>
          <p className="text-sm text-text-muted">{new Date(order.pickup_date).toLocaleString()}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {getAllowedNextStatuses(order.status as OrderStatus).map((nextStatus) => (
              <form key={nextStatus} action={updateOrderStatusAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="nextStatus" value={nextStatus} />
                <Button className="h-9" type="submit" variant={nextStatus === "cancelled" ? "secondary" : "primary"}>
                  Mark {nextStatus}
                </Button>
              </form>
            ))}
          </div>
        </Card>
      ))}
    </main>
  );
}
