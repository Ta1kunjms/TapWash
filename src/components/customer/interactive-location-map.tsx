"use client";

import dynamic from "next/dynamic";

type Coordinates = { lat: number; lng: number };

type Props = {
  center: Coordinates;
  pin: Coordinates;
  onSelect: (coords: Coordinates) => void;
  interactive?: boolean;
};

const InteractiveLocationMapInner = dynamic(
  () => import("@/components/customer/interactive-location-map-inner").then((mod) => mod.InteractiveLocationMapInner),
  {
    ssr: false,
    loading: () => <div className="h-56 w-full animate-pulse rounded-2xl border border-border-muted bg-slate-200" />,
  },
);

export function InteractiveLocationMap({ center, pin, onSelect, interactive = true }: Props) {
  return <InteractiveLocationMapInner center={center} pin={pin} onSelect={onSelect} interactive={interactive} />;
}
