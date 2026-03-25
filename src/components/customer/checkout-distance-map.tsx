"use client";

import dynamic from "next/dynamic";

type Coordinates = { lat: number; lng: number };

type Props = {
  laundromat: Coordinates;
  customer: Coordinates;
  routePath?: Coordinates[];
};

const CheckoutDistanceMapInner = dynamic(
  () => import("@/components/customer/checkout-distance-map-inner").then((mod) => mod.CheckoutDistanceMapInner),
  {
    ssr: false,
    loading: () => <div className="h-52 w-full animate-pulse rounded-2xl border border-border-muted bg-slate-200" />,
  },
);

export function CheckoutDistanceMap({ laundromat, customer, routePath }: Props) {
  return <CheckoutDistanceMapInner laundromat={laundromat} customer={customer} routePath={routePath} />;
}
