import { assignRiderAction, updateDeliveryStatusAction, updateRiderLocationAction } from "@/app/actions/dispatch";
import { DispatchSimulator } from "@/components/shop/dispatch-simulator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listAvailableRiders, listShopDispatchOrders } from "@/services/riders";

export default async function ShopDispatchPage() {
  const [orders, riders] = await Promise.all([listShopDispatchOrders(), listAvailableRiders()]);

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Rider Dispatch</h1>
      {(orders ?? []).map((order) => (
        <Card key={order.id}>
          <p className="font-semibold">Order {order.id.slice(0, 8)}</p>
          <p className="text-sm text-text-secondary">Status: {order.status}</p>
          <p className="text-sm text-text-muted">Dropoff: {order.dropoff_address ?? "N/A"}</p>
          <form action={assignRiderAction} className="mt-3 flex gap-2">
            <input type="hidden" name="orderId" value={order.id} />
            <select name="riderId" className="h-10 rounded-xl border border-border-muted bg-white px-3 text-sm" required>
              <option value="">Select rider</option>
              {(riders ?? []).map((rider) => (
                <option key={rider.id} value={rider.id}>
                  Rider {rider.profile_id.slice(0, 8)}
                </option>
              ))}
            </select>
            <Button type="submit" className="h-10">Assign</Button>
          </form>
          <div className="mt-2 flex flex-wrap gap-2">
            <form action={updateDeliveryStatusAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="status" value="picked_up" />
              <Button type="submit" className="h-9" variant="secondary">Picked up</Button>
            </form>
            <form action={updateDeliveryStatusAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="status" value="in_transit" />
              <Button type="submit" className="h-9" variant="secondary">In transit</Button>
            </form>
            <form action={updateDeliveryStatusAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="status" value="delivered" />
              <Button type="submit" className="h-9">Delivered</Button>
            </form>
          </div>

          <form action={updateRiderLocationAction} className="mt-3 grid gap-2 md:grid-cols-4">
            <input type="hidden" name="orderId" value={order.id} />
            <Input required name="riderId" placeholder="Rider ID" />
            <Input required name="lat" type="number" step="0.00001" placeholder="Latitude" />
            <Input required name="lng" type="number" step="0.00001" placeholder="Longitude" />
            <div className="md:col-span-4 grid gap-2 md:grid-cols-3">
              <Input name="heading" type="number" step="1" placeholder="Heading (optional)" />
              <Input name="speedKph" type="number" step="0.1" placeholder="Speed kph (optional)" />
              <Button type="submit">Update rider location</Button>
            </div>
          </form>

          <DispatchSimulator
            orderId={order.id}
            defaultTargetLat={order.dropoff_lat ? Number(order.dropoff_lat) : null}
            defaultTargetLng={order.dropoff_lng ? Number(order.dropoff_lng) : null}
          />
        </Card>
      ))}
      {(orders ?? []).length === 0 && <Card>No orders ready for dispatch.</Card>}
    </main>
  );
}
