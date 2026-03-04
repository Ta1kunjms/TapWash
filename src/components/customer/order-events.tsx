import { getOrderEvents } from "@/services/notifications";

export async function OrderEvents({ orderId }: { orderId: string }) {
  const events = await getOrderEvents(orderId);

  if (events.length === 0) return null;

  return (
    <div className="mt-2 rounded-xl bg-white p-2">
      <p className="mb-1 text-xs font-semibold text-text-secondary">Recent updates</p>
      <ul className="space-y-1 text-xs text-text-muted">
        {events.slice(0, 3).map((event) => (
          <li key={event.id}>
            {event.event_type.replaceAll("_", " ")} · {new Date(event.created_at).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
