"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

type Coordinates = { lat: number; lng: number };

type Props = {
  rider: Coordinates;
  pickup: Coordinates | null;
  dropoff: Coordinates | null;
};

function FitBounds({ rider, pickup, dropoff }: Props) {
  const map = useMap();

  useEffect(() => {
    const points: Array<[number, number]> = [[rider.lat, rider.lng]];

    if (pickup) {
      points.push([pickup.lat, pickup.lng]);
    }

    if (dropoff) {
      points.push([dropoff.lat, dropoff.lng]);
    }

    map.fitBounds(points, {
      padding: [24, 24],
      maxZoom: 15,
      animate: false,
    });
  }, [dropoff, map, pickup, rider.lat, rider.lng]);

  return null;
}

export function DeliveryLiveMapInner({ rider, pickup, dropoff }: Props) {
  const riderToDropoffPositions: Array<[number, number]> | null = dropoff
    ? [
        [rider.lat, rider.lng],
        [dropoff.lat, dropoff.lng],
      ]
    : null;

  const pickupToDropoffPositions: Array<[number, number]> | null = pickup && dropoff
    ? [
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng],
      ]
    : null;

  return (
    <div className="h-52 w-full overflow-hidden rounded-xl border border-[#d8e8f4]">
      <MapContainer
        center={[rider.lat, rider.lng]}
        zoom={14}
        scrollWheelZoom={false}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <FitBounds rider={rider} pickup={pickup} dropoff={dropoff} />

        {pickupToDropoffPositions ? (
          <Polyline
            positions={pickupToDropoffPositions}
            pathOptions={{ color: "#7fa9c7", weight: 2, opacity: 0.6, dashArray: "4 4" }}
          />
        ) : null}

        {riderToDropoffPositions ? (
          <Polyline
            positions={riderToDropoffPositions}
            pathOptions={{ color: "#178bd1", weight: 3, opacity: 0.86 }}
          />
        ) : null}

        <CircleMarker
          center={[rider.lat, rider.lng]}
          radius={7}
          pathOptions={{ color: "#0f6ea8", fillColor: "#178bd1", fillOpacity: 1, weight: 2 }}
        />

        {pickup ? (
          <CircleMarker
            center={[pickup.lat, pickup.lng]}
            radius={6}
            pathOptions={{ color: "#1d8f57", fillColor: "#22c55e", fillOpacity: 1, weight: 2 }}
          />
        ) : null}

        {dropoff ? (
          <CircleMarker
            center={[dropoff.lat, dropoff.lng]}
            radius={6}
            pathOptions={{ color: "#d9534f", fillColor: "#ef4444", fillOpacity: 1, weight: 2 }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
