"use client";

import dynamic from "next/dynamic";

type Coordinates = { lat: number; lng: number };

type Props = {
  rider: Coordinates;
  pickup: Coordinates | null;
  dropoff: Coordinates | null;
};

const DeliveryLiveMapInner = dynamic(
  () => import("@/components/customer/delivery-live-map-inner").then((mod) => mod.DeliveryLiveMapInner),
  {
    ssr: false,
    loading: () => <div className="h-52 w-full animate-pulse rounded-xl border border-[#d8e8f4] bg-slate-200" />,
  },
);

export function DeliveryLiveMap({ rider, pickup, dropoff }: Props) {
  return <DeliveryLiveMapInner rider={rider} pickup={pickup} dropoff={dropoff} />;
}
