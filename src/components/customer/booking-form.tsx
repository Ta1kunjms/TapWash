"use client";

import { OrderStepper } from "@/components/customer/order-stepper";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import {
  calculateServiceEstimate,
  getEstimatedLoadCount,
  getServiceLoadCapacityKg,
  type PricingOptionGroup,
  type PricingService,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

type ShopService = PricingService & {
  service_option_groups?: PricingOptionGroup[];
};

type ShopItem = {
  id: string;
  shop_name: string;
  location: string;
  starting_price: number;
  load_capacity_kg: number;
  services: ShopService[];
};

function getInitialShopId(shops: ShopItem[], initialShopId?: string) {
  if (initialShopId && shops.some((shop) => shop.id === initialShopId)) {
    return initialShopId;
  }

  return shops[0]?.id ?? "";
}

export function BookingForm({
  shops,
  initialShopId,
}: {
  shops: ShopItem[];
  initialShopId?: string;
}) {
  const [shopId] = useState(getInitialShopId(shops, initialShopId));
  const bookingDraft = readBookingDraft(getInitialShopId(shops, initialShopId));

  const selectedShop = shops.find((shop) => shop.id === shopId) ?? shops[0];

  const services = selectedShop?.services ?? [];
  const [serviceId, setServiceId] = useState(() => bookingDraft?.serviceId ?? "");

  const selectedServiceId = services.some((service) => service.id === serviceId)
    ? serviceId
    : (services[0]?.id ?? "");
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? services[0];
  const loadCapacityKg = selectedService
    ? getServiceLoadCapacityKg(selectedService, selectedShop?.load_capacity_kg)
    : Number(selectedShop?.load_capacity_kg ?? 8);
  const [selectedLoads, setSelectedLoads] = useState<number>(() => clampLoadCount(bookingDraft?.selectedLoads ?? 1));
  const weight = estimateWeightFromLoads(selectedLoads, loadCapacityKg);
  const estimate = selectedService
    ? calculateServiceEstimate({
        service: selectedService,
        weightKg: weight,
        shopLoadCapacityKg: selectedShop?.load_capacity_kg,
      })
    : null;
  const subtotal = estimate?.subtotal ?? 0;
  const loadCount = estimate?.loadCount ?? getEstimatedLoadCount(weight, loadCapacityKg);
  const menuHref = shopId ? `/customer/shops/${encodeURIComponent(shopId)}` : "/customer/shops";
  const quickPicks = [1, 2, 3].map((loads) => ({
    loads,
    label: `${loads} ${loads === 1 ? "Load" : "Loads"}`,
    description: getQuickPickDescription(selectedService?.name ?? "", loads),
    total: selectedService
      ? calculateServiceEstimate({
          service: selectedService,
          weightKg: estimateWeightFromLoads(loads, loadCapacityKg),
          shopLoadCapacityKg: selectedShop?.load_capacity_kg,
        }).subtotal
      : 0,
  }));

  const checkoutParams = new URLSearchParams();

  if (shopId) checkoutParams.set("shopId", shopId);
  if (selectedServiceId) checkoutParams.set("serviceId", selectedServiceId);
  if (weight > 0) checkoutParams.set("weight", weight.toFixed(1));

  const checkoutHref = `/customer/orders/checkout?${checkoutParams.toString()}`;

  useEffect(() => {
    if (!shopId || typeof window === "undefined") return;

    window.localStorage.setItem(
      getBookingDraftKey(shopId),
      JSON.stringify({
        serviceId: selectedServiceId,
        selectedLoads,
      }),
    );
  }, [selectedLoads, selectedServiceId, shopId]);

  return (
    <div className="space-y-4 pb-32">
      <section className="-mx-4 rounded-b-[2rem] bg-[linear-gradient(180deg,#ddecfb_0%,#cce4fa_100%)] px-4 pb-5 pt-3 shadow-[0_12px_28px_rgba(90,140,184,0.18)]">
        <div className="flex items-start gap-3">
          <Link
            href={menuHref}
            className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0081c9] transition hover:bg-white/40"
            aria-label="Go back to menu"
          >
            <FlaticonIcon name="angle-small-left" className="text-2xl" />
          </Link>

          <div className="min-w-0">
            <h1 className="text-[1.65rem] font-black leading-none text-[#2b4673]">Bucket</h1>
            <p className="mt-1 text-sm font-semibold text-[#4aa3dd]">{selectedShop?.shop_name ?? "Laundry Shop"}</p>
          </div>
        </div>

        <div className="mt-4">
          <OrderStepper currentStep={1} />
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-[#c8dbea] bg-white/92 p-4 shadow-[0_10px_24px_rgba(92,128,160,0.15)]">
        <div className="space-y-1">
          {services.map((service, index) => {

            const visual = getServiceVisual(service.name);
            const isSelected = service.id === selectedServiceId;
            const displayLoads = isSelected ? String(selectedLoads) : "0";
            // Show price as unit_price * selectedLoads if selected, else 0
            const displayPrice = isSelected ? service.unit_price * selectedLoads : 0;

            return (
              <div key={service.id}>
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setServiceId(service.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-black", visual.iconClass)}>
                      {visual.badge}
                    </span>
                    <span className="text-[1rem] font-bold leading-tight text-[#1d8bd3]">{service.name}</span>
                  </button>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="min-w-[4.75rem] text-right text-[0.72rem] font-bold text-[#9ec6e3]">{formatCurrency(displayPrice)}</span>
                    <div className="flex items-center gap-1.5">
                      <CircleAdjustButton
                        label={`Decrease ${service.name}`}
                        tone="muted"
                        onClick={() => {
                          if (!isSelected) return;
                          adjustLoadCount(setSelectedLoads, -1);
                        }}
                      >
                        -
                      </CircleAdjustButton>
                      <span className="min-w-[2.5rem] text-center text-sm font-bold text-[#77accc]">{displayLoads}</span>
                      <CircleAdjustButton
                        label={`Increase ${service.name}`}
                        tone="primary"
                        onClick={() => {
                          if (!isSelected) {
                            setServiceId(service.id);
                            setSelectedLoads(1);
                            return;
                          }

                          adjustLoadCount(setSelectedLoads, 1);
                        }}
                      >
                        +
                      </CircleAdjustButton>
                    </div>
                  </div>
                </div>

                {index < services.length - 1 ? <div className="h-px bg-[#dbe7f1]" /> : null}
              </div>
            );
          })}
        </div>
      </section>

      {quickPicks.length > 0 ? (
        <section className="space-y-3">
          <div className="space-y-3">
            {quickPicks.map((service) => (
              <button
                key={service.loads}
                type="button"
                onClick={() => {
                  setSelectedLoads(service.loads);
                }}
                className="w-full rounded-[1.15rem] border border-[#c7d9e8] bg-white px-4 py-3.5 text-left shadow-[0_8px_18px_rgba(92,128,160,0.12)] transition hover:border-[#9fcae8]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.98rem] font-black text-[#2f8ecf]">{service.label}</p>
                    <p className="mt-0.5 text-[0.92rem] font-semibold text-[#5fa8dd]">{service.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.78rem] font-bold text-[#b6cee2]">{formatCurrency(service.total)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Pro upsell card moved to checkout page */}

      <section className="rounded-[1.1rem] border border-[#c7d9e8] bg-white px-4 py-3.5 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.74rem] font-black uppercase tracking-[0.16em] text-[#7aaed3]">Selection</p>
            <h2 className="mt-1 text-[0.98rem] font-black text-[#2f8ecf]">Review your bucket</h2>
          </div>
          <span className="rounded-full bg-[#edf7ff] px-3 py-1 text-[0.72rem] font-black text-[#1f8fd6]">{selectedLoads} {selectedLoads === 1 ? "load" : "loads"}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.98rem] font-black text-[#2f8ecf]">Subtotal</p>
            <p className="mt-1 text-[0.72rem] font-semibold text-[#69aedd]">{selectedService?.name ?? "Selected service"}</p>
            <p className="mt-1 text-[0.72rem] font-semibold text-[#9ec6e3]">Rate: {formatCurrency(selectedService?.unit_price ?? 0)}</p>
            <p className="mt-1 text-[0.72rem] font-semibold text-[#9ec6e3]">Machine load: about {loadCapacityKg.toFixed(0)} kg</p>
            <p className="mt-1 text-[0.72rem] font-semibold text-[#9ec6e3]">Estimated weight for pricing: {weight.toFixed(1)} kg</p>
          </div>
          <div className="text-right">
            <p className="text-[0.78rem] font-bold text-[#9fc6e1]">{formatCurrency(subtotal)}</p>
          </div>
        </div>

        {selectedService?.service_option_groups?.length ? (
          <p className="mt-3 text-[0.76rem] font-semibold text-[#69aedd]">
            Custom care available at checkout: {selectedService.service_option_groups.map((group) => group.name).join(", ")}
          </p>
        ) : null}

        {/* Suggested add-ons removed as requested */}
      </section>

      {/* Floating subtotal + checkout button container */}
      <div className="fixed left-0 right-0 bottom-0 z-30 pointer-events-none">
        <div className="pointer-events-auto w-full rounded-t-[2rem] rounded-b-none bg-gradient-to-b from-[#eaf5ff] to-[#d6eafd] shadow-[0_8px_24px_rgba(33,126,191,0.13)] px-6 pt-4 pb-3 flex flex-col items-stretch">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[1.08rem] font-bold text-[#217ebf]">Subtotal <span className="font-normal text-[#8bb8d6]">(incl. fees and tax)</span></span>
            <span className="text-[1.08rem] font-bold text-[#43a9eb]">{formatCurrency(subtotal)}</span>
          </div>
          <Link
            href={checkoutHref}
            className="block w-full rounded-full bg-[#43a9eb] px-4 py-4 text-center text-[1.2rem] font-medium leading-none text-white shadow-[0_12px_26px_rgba(33,126,191,0.35)] transition hover:bg-[#389fdf]"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}

function CircleAdjustButton({
  children,
  label,
  tone,
  onClick,
}: {
  children: string;
  label: string;
  tone: "muted" | "primary";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full text-sm font-bold leading-none",
        tone === "primary" && "bg-[#3fa9f0] text-white",
        tone === "muted" && "bg-[#cfecff] text-[#3fa9f0]",
      )}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function adjustLoadCount(setLoadCount: Dispatch<SetStateAction<number>>, delta: number) {
  setLoadCount((current) => {
    return clampLoadCount(current + delta);
  });
}

function formatCurrency(value: number) {
  return `₱${value.toFixed(2)}`;
}

function clampLoadCount(value: number) {
  return Math.min(20, Math.max(1, Math.round(value)));
}

function getBookingDraftKey(shopId: string) {
  return `tapwash.bookingDraft.${shopId}`;
}

function readBookingDraft(shopId: string): { serviceId?: string; selectedLoads?: number } | null {
  if (!shopId || typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getBookingDraftKey(shopId));
    if (!raw) return null;
    return JSON.parse(raw) as { serviceId?: string; selectedLoads?: number };
  } catch {
    return null;
  }
}

function estimateWeightFromLoads(loadCount: number, loadCapacityKg: number) {
  return Number(Math.max(1, loadCount * loadCapacityKg).toFixed(1));
}

function getQuickPickDescription(name: string, loads: number) {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("dry")) {
    return `${loads} dryer cycle${loads === 1 ? "" : "s"}`;
  }

  if (normalizedName.includes("fold")) {
    return `${loads} staff-handled bundle${loads === 1 ? "" : "s"}`;
  }

  if (normalizedName.includes("iron")) {
    return `${loads} pressed load${loads === 1 ? "" : "s"}`;
  }

  if (normalizedName.includes("stain")) {
    return `${loads} stain-care load${loads === 1 ? "" : "s"}`;
  }

  if (normalizedName.includes("clean")) {
    return `${loads} care load${loads === 1 ? "" : "s"}`;
  }

  return `${loads} wash-ready load${loads === 1 ? "" : "s"}`;
}

function getServiceVisual(name: string) {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("wash")) {
    return { badge: "WA", iconClass: "bg-[#dff1ff] text-[#0081c9] ring-[#a9d8fb]" };
  }

  if (normalizedName.includes("dry")) {
    return { badge: "DR", iconClass: "bg-[#e6f7f0] text-[#1aa37a] ring-[#b7ead9]" };
  }

  if (normalizedName.includes("fold")) {
    return { badge: "FO", iconClass: "bg-[#f6efff] text-[#7756d8] ring-[#d9ccff]" };
  }

  if (normalizedName.includes("iron")) {
    return { badge: "IR", iconClass: "bg-[#fff1e5] text-[#ec7a26] ring-[#ffd6b0]" };
  }

  if (normalizedName.includes("stain")) {
    return { badge: "SR", iconClass: "bg-[#ffe7eb] text-[#d34c71] ring-[#ffc7d4]" };
  }

  if (normalizedName.includes("clean")) {
    return { badge: "DC", iconClass: "bg-[#ebf4ff] text-[#376cd9] ring-[#c5dafd]" };
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "SV";

  return { badge: initials, iconClass: "bg-[#dff1ff] text-[#0081c9] ring-[#a9d8fb]" };
}
