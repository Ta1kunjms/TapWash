"use client";

import { CheckoutDistanceMap } from "@/components/customer/checkout-distance-map";

type Props = {
  shopName: string;
  roadDistanceKm: number | null;
  pickupLat: number | null;
  pickupLng: number | null;
  shopLat: number | null;
  shopLng: number | null;
  routePath?: Array<{ lat: number; lng: number }>;
};

export function CheckoutMapPreviewSection({
  shopName,
  roadDistanceKm,
  pickupLat,
  pickupLng,
  shopLat,
  shopLng,
  routePath,
}: Props) {
  return (
    <section className="rounded-[1.2rem] border border-[#cfe3f2] bg-white p-4 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7aaed3]">Map preview</p>
          <h2 className="mt-1 text-[1rem] font-black text-[#2f5878]">Customer and laundromat distance</h2>
          <p className="mt-1 text-[0.78rem] font-semibold text-[#6d90aa]">Distance is measured from pickup address to {shopName}.</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#eaf5ff] px-3 py-1 text-[0.72rem] font-black text-[#1f8fd6]">
          {roadDistanceKm !== null ? `${roadDistanceKm.toFixed(1)} km` : "Pending"}
        </span>
      </div>

      <div className="mt-3">
        {pickupLat !== null && pickupLng !== null && shopLat !== null && shopLng !== null ? (
          <CheckoutDistanceMap
            laundromat={{ lat: shopLat, lng: shopLng }}
            customer={{ lat: pickupLat, lng: pickupLng }}
            routePath={routePath}
          />
        ) : (
          <div className="flex h-52 items-center justify-center rounded-2xl border border-[#d8e8f4] bg-[#f7fbff] px-4 text-center text-[0.82rem] font-semibold text-[#6d90aa]">
            Set pickup address and wait for a quote to load the route map.
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {pickupLat !== null && pickupLng !== null ? (
          <a
            href={`https://www.google.com/maps?q=${pickupLat},${pickupLng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-[0.76rem] font-black text-[#2f8ecf] underline"
          >
            Open pickup in Maps
          </a>
        ) : null}

        {shopLat !== null && shopLng !== null ? (
          <a
            href={`https://www.google.com/maps?q=${shopLat},${shopLng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-[0.76rem] font-black text-[#2f8ecf] underline"
          >
            Open laundromat in Maps
          </a>
        ) : null}
      </div>
    </section>
  );
}
