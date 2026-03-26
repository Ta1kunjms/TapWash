"use client";

import dynamic from "next/dynamic";

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

const ServiceAreaMapInner = dynamic(
  () => import("@/components/customer/service-area-map-inner").then((mod) => mod.ServiceAreaMapInner),
  {
    ssr: false,
    loading: () => <div className="h-44 w-full animate-pulse rounded-xl border border-[#d8e8f4] bg-slate-200" />,
  },
);

export function ServiceAreaMap({ shops, userLocation }: Props) {
  return <ServiceAreaMapInner shops={shops} userLocation={userLocation} />;
}
