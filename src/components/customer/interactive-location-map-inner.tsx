"use client";

import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";

type Coordinates = { lat: number; lng: number };

type Props = {
  center: Coordinates;
  pin: Coordinates;
  onSelect: (coords: Coordinates) => void;
  interactive: boolean;
};

function SelectOnTap({ onSelect }: { onSelect: (coords: Coordinates) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

export function InteractiveLocationMapInner({ center, pin, onSelect, interactive }: Props) {
  return (
    <div className="h-56 w-full overflow-hidden rounded-2xl border border-border-muted">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={16}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        zoomControl={interactive}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {interactive ? <SelectOnTap onSelect={onSelect} /> : null}
        <CircleMarker
          center={[pin.lat, pin.lng]}
          radius={8}
          pathOptions={{ color: "#0284c7", fillColor: "#0ea5e9", fillOpacity: 1, weight: 2 }}
        />
      </MapContainer>
    </div>
  );
}
