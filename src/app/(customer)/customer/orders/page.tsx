import { Card } from "@/components/ui/card";
import Link from "next/link";
import { DeliveryTrackingPanel } from "@/components/customer/delivery-tracking-panel";
import { OrderEvents } from "@/components/customer/order-events";
import { OrderTracker } from "@/components/customer/order-tracker";
import { getMyOrders } from "@/services/orders";

export default async function CustomerOrdersPage() {
  const orders = await getMyOrders();

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Link className="text-sm text-primary-500" href="/customer/orders/new">
          Book laundry
        </Link>
      </div>
      {orders.length === 0 && <Card>No orders yet.</Card>}
      {orders.map((order) => (
        <Card key={order.id}>
          <p className="text-sm text-text-secondary">
            Shop: {(Array.isArray(order.laundry_shops) ? order.laundry_shops[0]?.shop_name : undefined) ?? "Laundry Shop"}
          </p>
          <p className="font-semibold">Status: {order.status}</p>
          <OrderTracker orderId={order.id} initialStatus={order.status} />
          <p className="text-sm text-text-secondary">Total: ₱{order.total_price}</p>
          <p className="text-xs text-text-muted">Payment: {order.payment_method} · Ref: {order.payment_reference ?? "N/A"}</p>
          {order.promo_code && <p className="text-xs text-primary-500">Promo {order.promo_code} applied (-₱{order.discount_amount})</p>}
          {(order.distance_km || order.eta_minutes) && (
            <p className="text-xs text-text-muted">
              Route: {order.distance_km ?? "-"} km · ETA {order.eta_minutes ?? "-"} mins
            </p>
          )}
          <p className="text-sm text-text-muted">Pickup: {new Date(order.pickup_date).toLocaleString()}</p>
          {(order.status === "out_for_delivery" || order.status === "ready") && (
            <DeliveryTrackingPanel orderId={order.id} />
          )}
          {order.status === "completed" && <p className="mt-2 text-xs text-primary-500">Order completed. You can now leave a review.</p>}
          <OrderEvents orderId={order.id} />
        </Card>
      ))}
    </main>
  );
}
