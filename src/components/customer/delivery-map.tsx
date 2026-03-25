"use client";

import { DeliveryLiveMap } from "@/components/customer/delivery-live-map";
import { useRiderTracking } from "@/hooks/use-rider-tracking";
import { useMemo } from "react";

type Props = {
  orderId: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  initial: {
    location: { lat: number; lng: number; updated_at: string } | null;
    delivery: { status: string; eta_minutes: number | null } | null;
  };
};

export function DeliveryMap({ orderId, pickupLat, pickupLng, dropoffLat, dropoffLng, initial }: Props) {
  const { location, delivery } = useRiderTracking(orderId, initial);

  const liveDistanceKm = useMemo(() => {
    if (!location || dropoffLat === null || dropoffLng === null) {
      return null;
    }

    const earthRadius = 6371;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const deltaLat = toRad(dropoffLat - location.lat);
    const deltaLng = toRad(dropoffLng - location.lng);
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(toRad(location.lat)) *
        Math.cos(toRad(dropoffLat)) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((earthRadius * c).toFixed(1));
  }, [dropoffLat, dropoffLng, location]);

  const arrivalClock = useMemo(() => {
    const etaMinutes = delivery?.eta_minutes;
    if (!etaMinutes || etaMinutes <= 0) {
      return "--:--";
    }

    const now = new Date();
    const arrival = new Date(now.getTime() + etaMinutes * 60 * 1000);
    const hours = String(arrival.getHours()).padStart(2, "0");
    const minutes = String(arrival.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }, [delivery?.eta_minutes]);

  const statusLabel = (delivery?.status ?? "assigned").replaceAll("_", " ");
  const statusColor = useMemo(() => {
    if (!delivery?.status) return "#6d90aa";
    if (delivery.status === "delivered") return "#1d8f57";
    if (delivery.status === "failed" || delivery.status === "cancelled") return "#d9534f";
    if (delivery.status === "in_transit") return "#178bd1";
    return "#cf8a1a";
  }, [delivery?.status]);

  if (!location && !delivery) {
    return (
      <section className="rounded-[1rem] border border-[#d8e8f4] bg-[#f9fcff] p-4 text-center">
        <p className="text-[0.82rem] font-semibold text-[#6d90aa]">Waiting for rider tracking data.</p>
      </section>
    );
  }

  const hasLocation = Boolean(location);
  const mapHref = hasLocation
    ? `https://www.google.com/maps?q=${location?.lat},${location?.lng}`
    : "https://maps.google.com";
  const riderPoint = location ? { lat: location.lat, lng: location.lng } : null;

  return (
    <section className="rounded-[1rem] border border-[#d8e8f4] bg-[#f9fcff] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#6d90aa]">Live rider tracking</p>
        {hasLocation ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.08em] text-[#1d8f57]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
            Live
          </span>
        ) : null}
      </div>

      {riderPoint ? (
        <div className="mt-2">
          <DeliveryLiveMap
            rider={riderPoint}
            pickup={pickupLat !== null && pickupLng !== null ? { lat: pickupLat, lng: pickupLng } : null}
            dropoff={dropoffLat !== null && dropoffLng !== null ? { lat: dropoffLat, lng: dropoffLng } : null}
          />
          <p className="mt-1 text-[0.68rem] font-semibold text-[#89a7bd]">Blue marker: rider • Green: pickup • Red: destination</p>
        </div>
      ) : null}

      <div className="mt-2 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-[#e0ecf5] bg-white px-2.5 py-2 text-center">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#91aec4]">Distance</p>
          <p className="mt-1 text-[0.9rem] font-black text-[#178bd1]">{liveDistanceKm !== null ? `${liveDistanceKm} km` : "--"}</p>
        </div>
        <div className="rounded-lg border border-[#e0ecf5] bg-white px-2.5 py-2 text-center">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#91aec4]">ETA</p>
          <p className="mt-1 text-[0.9rem] font-black text-[#178bd1]">{arrivalClock}</p>
        </div>
        <div className="rounded-lg border border-[#e0ecf5] bg-white px-2.5 py-2 text-center">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#91aec4]">Status</p>
          <p className="mt-1 text-[0.78rem] font-black capitalize" style={{ color: statusColor }}>
            {statusLabel}
          </p>
        </div>
      </div>

      <div className="mt-2 rounded-lg border border-[#e0ecf5] bg-white p-2.5">
        {hasLocation ? (
          <>
            <p className="text-[0.76rem] font-semibold text-[#577995]">📍 {location?.lat.toFixed(5)}, {location?.lng.toFixed(5)}</p>
            <p className="text-[0.7rem] font-medium text-[#93adc2]">Updated {new Date(location?.updated_at ?? "").toLocaleTimeString()}</p>
          </>
        ) : (
          <p className="text-[0.76rem] font-semibold text-[#93adc2]">Location pending</p>
        )}
      </div>

      <p className="mt-2 text-[0.74rem] font-semibold text-[#7f9db4]">
        Delivery status: {delivery?.status ?? "assigned"} · ETA {delivery?.eta_minutes ?? "-"} mins
      </p>

      <a className="mt-1 inline-block text-[0.74rem] font-black text-[#178bd1] underline" href={mapHref} target="_blank" rel="noreferrer">
        Open in Google Maps
      </a>
    </section>
  );
}
