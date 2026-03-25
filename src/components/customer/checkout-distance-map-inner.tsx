"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

type Coordinates = { lat: number; lng: number };

type Props = {
  laundromat: Coordinates;
  customer: Coordinates;
  routePath?: Coordinates[];
};

function FitBounds({ laundromat, customer, routePath }: Props) {
  const map = useMap();

  useEffect(() => {
    const bounds: Array<[number, number]> =
      routePath && routePath.length > 1
        ? routePath.map((point) => [point.lat, point.lng] as [number, number])
        : [
            [laundromat.lat, laundromat.lng],
            [customer.lat, customer.lng],
          ];

    map.fitBounds(bounds, {
      padding: [24, 24],
      maxZoom: 15,
      animate: false,
    });
  }, [customer.lat, customer.lng, laundromat.lat, laundromat.lng, map, routePath]);

  return null;
}

export function CheckoutDistanceMapInner({ laundromat, customer, routePath }: Props) {
  return (
    <div className="h-52 w-full overflow-hidden rounded-2xl border border-border-muted">
      <MapContainer
        center={[laundromat.lat, laundromat.lng]}
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
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds laundromat={laundromat} customer={customer} routePath={routePath} />

        <Polyline
          positions={
            routePath && routePath.length > 1
              ? routePath.map((point) => [point.lat, point.lng] as [number, number])
              : [
                  [laundromat.lat, laundromat.lng],
                  [customer.lat, customer.lng],
                ]
          }
          pathOptions={{ color: "#1f8fd6", weight: 3, opacity: 0.8 }}
        />

        <CircleMarker
          center={[laundromat.lat, laundromat.lng]}
          radius={7}
          pathOptions={{ color: "#1d4f91", fillColor: "#1d4f91", fillOpacity: 1, weight: 2 }}
        />

        <CircleMarker
          center={[customer.lat, customer.lng]}
          radius={7}
          pathOptions={{ color: "#2f8ecf", fillColor: "#2f8ecf", fillOpacity: 1, weight: 2 }}
        />
      </MapContainer>
    </div>
  );
}
