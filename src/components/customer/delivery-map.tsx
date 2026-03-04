"use client";

import { useRiderTracking } from "@/hooks/use-rider-tracking";

type Props = {
  orderId: string;
  initial: {
    location: { lat: number; lng: number; updated_at: string } | null;
    delivery: { status: string; eta_minutes: number | null } | null;
  };
};

export function DeliveryMap({ orderId, initial }: Props) {
  const { location, delivery } = useRiderTracking(orderId, initial);

  if (!location && !delivery) {
    return <p className="text-xs text-text-muted">Waiting for rider tracking.</p>;
  }

  const hasLocation = Boolean(location);
  const mapHref = hasLocation
    ? `https://www.google.com/maps?q=${location?.lat},${location?.lng}`
    : "https://maps.google.com";

  return (
    <div className="mt-2 rounded-xl border border-border-muted bg-white p-3">
      <p className="text-xs font-semibold text-text-secondary">Live Rider Tracking</p>
      <div className="mt-2 h-24 rounded-lg bg-background-app p-2">
        {hasLocation ? (
          <>
            <p className="text-xs text-text-primary">📍 {location?.lat.toFixed(5)}, {location?.lng.toFixed(5)}</p>
            <p className="text-[11px] text-text-muted">Updated {new Date(location?.updated_at ?? "").toLocaleTimeString()}</p>
          </>
        ) : (
          <p className="text-xs text-text-muted">Location pending</p>
        )}
      </div>
      <p className="mt-2 text-xs text-text-muted">
        Delivery status: {delivery?.status ?? "assigned"} · ETA {delivery?.eta_minutes ?? "-"} mins
      </p>
      <a className="mt-1 inline-block text-xs font-semibold text-primary-500" href={mapHref} target="_blank" rel="noreferrer">
        Open in Maps
      </a>
    </div>
  );
}
