"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import { useRouter } from "next/navigation";

type ServiceMapShop = {
  id: string;
  shop_name: string;
  lat: number;
  lng: number;
};

type Props = {
  shops: ServiceMapShop[];
  userLocation?: { lat: number; lng: number };
};

function FitBounds({ shops, userLocation }: Props) {
  const map = useMap();

  useEffect(() => {
    const points: Array<[number, number]> = shops.map((shop) => [shop.lat, shop.lng]);
    if (userLocation) {
      points.push([userLocation.lat, userLocation.lng]);
    }

    if (points.length === 0) {
      return;
    }

    map.fitBounds(points, {
      padding: [24, 24],
      maxZoom: 15,
      animate: false,
    });
  }, [map, shops, userLocation]);

  return null;
}

export function ServiceAreaMapInner({ shops, userLocation }: Props) {
  const router = useRouter();

  const shopMarkerIcon = useMemo(
    () =>
      L.icon({
        iconUrl: "/tapwash-logo.png",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -24],
      }),
    [],
  );

  const center = useMemo<[number, number]>(() => {
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }

    if (shops.length > 0) {
      return [shops[0].lat, shops[0].lng];
    }

    return [6.0688, 125.1325];
  }, [shops, userLocation]);

  return (
    <div className="h-44 w-full overflow-hidden rounded-xl border border-[#d8e8f4]">
      <MapContainer
        center={center}
        zoom={13}
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

        <FitBounds shops={shops} userLocation={userLocation} />

        {shops.map((shop) => (
          <Marker
            key={shop.id}
            position={[shop.lat, shop.lng]}
            icon={shopMarkerIcon}
            eventHandlers={{
              click: () => router.push(`/customer/shops/${shop.id}`),
            }}
          />
        ))}

        {userLocation ? (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={7}
            pathOptions={{ color: "#1d8f57", fillColor: "#22c55e", fillOpacity: 1, weight: 2 }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
