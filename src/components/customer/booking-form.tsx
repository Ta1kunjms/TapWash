"use client";

import { OrderStepper } from "@/components/customer/order-stepper";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import {
  calculateServiceEstimate,
  formatOptionPriceDelta,
  getDefaultSelectedOptionIds,
  getServiceLoadCapacityKg,
  resolveSelectedServiceOptions,
  type PricingOptionGroup,
  type PricingService,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

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

type BookingBucketSelection = {
  serviceId: string;
  loads: number;
  selectedOptionIds?: string[];
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
  initialServiceId,
  initialBucket,
}: {
  shops: ShopItem[];
  initialShopId?: string;
  initialServiceId?: string;
  initialBucket?: BookingBucketSelection[];
}) {
  const [shopId] = useState(getInitialShopId(shops, initialShopId));

  const selectedShop = shops.find((shop) => shop.id === shopId) ?? shops[0];

  const services = selectedShop?.services ?? [];
  const [serviceLoads, setServiceLoads] = useState<Record<string, number>>(() =>
    buildInitialServiceLoads(services, initialBucket),
  );
  const [selectedOptionIdsByService, setSelectedOptionIdsByService] = useState<Record<string, string[]>>(() =>
    buildInitialSelectedOptionIdsByService(services, initialBucket),
  );
  const [activeServiceId, setActiveServiceId] = useState(() =>
    getInitialActiveServiceId(services, initialServiceId, initialBucket),
  );

  const selectedServiceId = services.some((service) => service.id === activeServiceId)
    ? activeServiceId
    : "";
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;
  const selectedServiceOptionGroups = selectedService?.service_option_groups ?? [];
  const normalizedSelectedOptionIds = selectedService
    ? resolveSelectedServiceOptions(
        selectedService,
        selectedOptionIdsByService[selectedService.id] ?? getDefaultSelectedOptionIds(selectedService),
      ).map((option) => option.id)
    : [];
  const selectedLoads = selectedServiceId ? serviceLoads[selectedServiceId] ?? 0 : 0;
  const loadCapacityKg = selectedService
    ? getServiceLoadCapacityKg(selectedService, selectedShop?.load_capacity_kg)
    : Number(selectedShop?.load_capacity_kg ?? 8);
  const weight = estimateWeightFromLoads(selectedLoads, loadCapacityKg);
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
  const totalLoads = Object.values(serviceLoads).reduce((sum, loads) => sum + loads, 0);
  const selectedServiceSummaries = services
    .map((service) => {
      const loads = serviceLoads[service.id] ?? 0;
      if (loads <= 0) return null;

      const serviceWeight = estimateWeightFromLoads(
        loads,
        getServiceLoadCapacityKg(service, selectedShop?.load_capacity_kg),
      );
      const serviceEstimate = calculateServiceEstimate({
        service,
        weightKg: serviceWeight,
        selectedOptionIds:
          selectedOptionIdsByService[service.id] ?? getDefaultSelectedOptionIds(service),
        shopLoadCapacityKg: selectedShop?.load_capacity_kg,
      });

      return {
        id: service.id,
        name: service.name,
        loads,
        subtotal: serviceEstimate.subtotal,
      };
    })
    .filter((entry): entry is { id: string; name: string; loads: number; subtotal: number } => entry !== null);
  const bucketSelections = selectedServiceSummaries.map((service) => ({
    serviceId: service.id,
    loads: service.loads,
    selectedOptionIds: selectedOptionIdsByService[service.id] ?? [],
  }));
  const subtotal = Number(
    selectedServiceSummaries.reduce((sum, service) => sum + service.subtotal, 0).toFixed(2),
  );
  const fallbackServiceId = bucketSelections[0]?.serviceId ?? "";
  const checkoutServiceId = selectedServiceId || fallbackServiceId;
  const checkoutLoads = checkoutServiceId ? serviceLoads[checkoutServiceId] ?? 0 : 0;
  const checkoutService = services.find((service) => service.id === checkoutServiceId) ?? null;
  const checkoutWeight = estimateWeightFromLoads(
    checkoutLoads,
    checkoutService
      ? getServiceLoadCapacityKg(checkoutService, selectedShop?.load_capacity_kg)
      : Number(selectedShop?.load_capacity_kg ?? 8),
  );
  const canCheckout = bucketSelections.length > 0;

  if (shopId) checkoutParams.set("shopId", shopId);
  if (checkoutServiceId) checkoutParams.set("serviceId", checkoutServiceId);
  if (checkoutWeight > 0) checkoutParams.set("weight", checkoutWeight.toFixed(1));
  if (bucketSelections.length > 0) checkoutParams.set("bucket", JSON.stringify(bucketSelections));

  const checkoutHref = `/customer/orders/checkout?${checkoutParams.toString()}`;

  return (
    <div className="space-y-4 pb-32">
      <section className="-mx-4 rounded-b-[2rem] bg-[linear-gradient(180deg,#ddecfb_0%,#cce4fa_100%)] px-4 pb-5 pt-3 shadow-[0_12px_28px_rgba(90,140,184,0.18)]">
        <div className="relative flex items-center justify-center">
          <Link
            href={menuHref}
            className="absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0081c9] transition hover:bg-white/40"
            aria-label="Go back to menu"
          >
            <FlaticonIcon name="angle-small-left" className="text-2xl" />
          </Link>

          <div className="min-w-0 px-12 text-center">
            <h1 className="text-[1.25rem] font-black leading-[0.92] text-[#233f6e]">Bucket</h1>
            <p className="mt-1 truncate text-[1rem] font-bold text-[#1f93d8]">{selectedShop?.shop_name ?? "Laundry Shop"}</p>
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
            const displayLoads = serviceLoads[service.id] ?? 0;
            const displayPrice = service.unit_price * displayLoads;

            return (
              <div key={service.id}>
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveServiceId(service.id);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-black", visual.iconClass)}>
                      {visual.badge}
                    </span>
                    <span className={cn("text-[1rem] font-bold leading-tight text-[#1d8bd3]", isSelected && "text-[#137cc1]")}>{service.name}</span>
                  </button>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="min-w-[4.75rem] text-right text-[0.72rem] font-bold text-[#9ec6e3]">{formatCurrency(displayPrice)}</span>
                    <div className="flex items-center gap-1.5">
                      <CircleAdjustButton
                        label={`Decrease ${service.name}`}
                        tone="muted"
                        onClick={() => {
                          setActiveServiceId(service.id);
                          setServiceLoads((current) => ({
                            ...current,
                            [service.id]: clampLoadCount((current[service.id] ?? 0) - 1),
                          }));
                        }}
                      >
                        -
                      </CircleAdjustButton>
                      <span className="min-w-[2.5rem] text-center text-sm font-bold text-[#77accc]">{displayLoads}</span>
                      <CircleAdjustButton
                        label={`Increase ${service.name}`}
                        tone="primary"
                        onClick={() => {
                          setActiveServiceId(service.id);
                          setServiceLoads((current) => ({
                            ...current,
                            [service.id]: clampLoadCount((current[service.id] ?? 0) + 1),
                          }));
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
            {quickPicks.map((service) => {
              const isSelected = service.loads === selectedLoads;

              return (
                <button
                  key={service.loads}
                  type="button"
                  onClick={() => {
                    if (!selectedServiceId) return;

                    setServiceLoads((current) => ({
                      ...current,
                      [selectedServiceId]: current[selectedServiceId] === service.loads ? 0 : service.loads,
                    }));
                  }}
                  aria-pressed={isSelected}
                  disabled={!selectedServiceId}
                  className={cn(
                    "w-full rounded-[1.15rem] border px-4 py-3.5 text-left shadow-[0_8px_18px_rgba(92,128,160,0.12)] transition",
                    isSelected
                      ? "border-[#3d9ae0] bg-[#edf7ff] ring-2 ring-[#9fd1f2]/70"
                      : "border-[#c7d9e8] bg-white hover:border-[#9fcae8]",
                    !selectedServiceId && "cursor-not-allowed opacity-60 hover:border-[#c7d9e8]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[0.98rem] font-black text-[#2f8ecf]">{service.label}</p>
                        {isSelected ? (
                          <span className="rounded-full bg-[#2f8ecf] px-2 py-0.5 text-[0.64rem] font-black uppercase tracking-[0.12em] text-white">
                            Selected
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[0.92rem] font-semibold text-[#5fa8dd]">
                        {selectedServiceId ? service.description : "Choose a service above to apply this load count"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-[0.78rem] font-bold", isSelected ? "text-[#2f8ecf]" : "text-[#b6cee2]")}>
                        {selectedServiceId ? formatCurrency(service.total) : "--"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {selectedServiceOptionGroups.length > 0 ? (
        <section className="rounded-[1.25rem] border border-[#bfd7e8] bg-white p-4 shadow-[0_10px_22px_rgba(92,128,160,0.14)]">
          <div className="mb-3">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#7aaed3]">Care preferences</p>
            <h2 className="mt-1 text-[1.02rem] font-black text-[#2c4f74]">{selectedService?.name}: detergent, fabcon, add-ons</h2>
          </div>

          <div className="space-y-3">
            {selectedServiceOptionGroups.map((group) => {
              const options = group.service_options ?? [];
              const selectedSet = new Set(normalizedSelectedOptionIds);

              return (
                <div key={group.id} className="rounded-[0.95rem] border border-[#d8e8f4] bg-[linear-gradient(180deg,#f8fcff_0%,#eef7ff_100%)] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[0.84rem] font-black text-[#2f5878]">{group.name}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-[#1f8fd6]">
                      {group.selection_type === "single" ? "PICK 1" : "PICK MANY"}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {options.map((option) => {
                      const isSelected = selectedSet.has(option.id);

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            if (!selectedService) return;

                            setSelectedOptionIdsByService((current) => ({
                              ...current,
                              [selectedService.id]: updateSelectedOptionIds(
                                current[selectedService.id] ?? getDefaultSelectedOptionIds(selectedService),
                                group,
                                option.id,
                              ),
                            }));
                          }}
                          className={cn(
                            "w-full rounded-[0.85rem] border px-3 py-2 text-left transition",
                            isSelected
                              ? "border-[#2196f3] bg-[#eaf6ff]"
                              : "border-[#d7e8f7] bg-white hover:border-[#9fcae8]",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-[#255375]">{option.name}</p>
                              {option.description ? <p className="mt-0.5 text-xs text-[#6d90aa]">{option.description}</p> : null}
                            </div>
                            <span className={cn("text-xs font-black", isSelected ? "text-[#0f7fd0]" : "text-[#7aaed3]")}>
                              {formatOptionPriceDelta(option)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
          <span className="rounded-full bg-[#edf7ff] px-3 py-1 text-[0.72rem] font-black text-[#1f8fd6]">{totalLoads} {totalLoads === 1 ? "load" : "loads"}</span>
        </div>

        {selectedServiceSummaries.length > 0 ? (
          <div className="space-y-2.5">
            {selectedServiceSummaries.map((service) => (
              <div key={service.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.9rem] font-black text-[#2f8ecf]">{service.name}</p>
                  <p className="mt-1 text-[0.72rem] font-semibold text-[#69aedd]">{service.loads} {service.loads === 1 ? "load" : "loads"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.78rem] font-bold text-[#9fc6e1]">{formatCurrency(service.subtotal)}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-[#dbe7f1] pt-2">
              <p className="text-[0.98rem] font-black text-[#2f8ecf]">Subtotal</p>
              <p className="text-[0.86rem] font-bold text-[#43a9eb]">{formatCurrency(subtotal)}</p>
            </div>
            {selectedService ? (
              <div className="text-[0.72rem] font-semibold text-[#9ec6e3]">
                <p>Active service: {selectedService.name}</p>
                <p className="mt-1">Rate: {formatCurrency(selectedService.unit_price ?? 0)}</p>
                <p className="mt-1">Machine load: about {loadCapacityKg.toFixed(0)} kg</p>
                <p className="mt-1">Estimated weight for checkout: {weight.toFixed(1)} kg</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.98rem] font-black text-[#2f8ecf]">Subtotal</p>
              <p className="mt-1 text-[0.72rem] font-semibold text-[#69aedd]">No services selected yet</p>
            </div>
            <div className="text-right">
              <p className="text-[0.78rem] font-bold text-[#9fc6e1]">{formatCurrency(0)}</p>
            </div>
          </div>
        )}

        {selectedService?.service_option_groups?.length ? (
          <p className="mt-3 text-[0.76rem] font-semibold text-[#69aedd]">
            Custom care available at checkout: {selectedService.service_option_groups.map((group) => group.name).join(", ")}
          </p>
        ) : null}

        {/* Suggested add-ons removed as requested */}
      </section>

      {/* Floating subtotal + checkout button container */}
      <div className="fixed left-0 right-0 bottom-0 z-30 pointer-events-none">
        <div className="pointer-events-auto w-full bg-gradient-to-b from-[#eaf5ff] to-[#d6eafd] shadow-[0_-8px_32px_0_rgba(33,126,191,0.18),0_-1.5px_0_0_#c7d9e8] pt-4 pb-3 flex flex-col items-stretch">
          <div className="flex items-center justify-between mb-3 px-4">
            <span className="text-[1.08rem] font-bold text-[#217ebf]">Subtotal <span className="font-normal text-[#8bb8d6]"></span></span>
            <span className="text-[1.08rem] font-bold text-[#43a9eb]">{formatCurrency(subtotal)}</span>
          </div>
          <Link
            href={checkoutHref}
            aria-disabled={!canCheckout}
            className={cn(
              "mx-4 flex h-12 items-center justify-center rounded-full bg-[#43a9eb] px-8 text-center text-[1.2rem] font-bold leading-none text-white shadow-[0_12px_26px_rgba(33,126,191,0.35)] transition hover:bg-[#389fdf]",
              !canCheckout && "pointer-events-none opacity-70",
            )}
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

function formatCurrency(value: number) {
  return `₱${value.toFixed(2)}`;
}

function clampLoadCount(value: number) {
  return Math.min(20, Math.max(0, Math.round(value)));
}

function buildInitialServiceLoads(services: ShopService[], bucket?: BookingBucketSelection[]) {
  if (!Array.isArray(bucket) || bucket.length === 0) {
    return {};
  }

  return bucket.reduce<Record<string, number>>((result, selection) => {
    if (!services.some((service) => service.id === selection.serviceId)) {
      return result;
    }

    const loads = clampLoadCount(selection.loads);
    if (loads > 0) {
      result[selection.serviceId] = loads;
    }

    return result;
  }, {});
}

function sanitizeOptionIds(value: string[] | undefined) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function buildInitialSelectedOptionIdsByService(
  services: ShopService[],
  bucket?: BookingBucketSelection[],
) {
  const source = Array.isArray(bucket) ? bucket : [];

  return services.reduce<Record<string, string[]>>((result, service) => {
    const bucketEntry = source.find((entry) => entry.serviceId === service.id);
    const requested = sanitizeOptionIds(bucketEntry?.selectedOptionIds);

    result[service.id] = resolveSelectedServiceOptions(
      service,
      requested.length > 0 ? requested : getDefaultSelectedOptionIds(service),
    ).map((option) => option.id);

    return result;
  }, {});
}

function updateSelectedOptionIds(current: string[], group: PricingOptionGroup, optionId: string) {
  const groupOptionIds = new Set((group.service_options ?? []).map((option) => option.id));

  if (group.selection_type === "single") {
    return [...current.filter((entry) => !groupOptionIds.has(entry)), optionId];
  }

  if (current.includes(optionId)) {
    const next = current.filter((entry) => entry !== optionId);
    return group.is_required && next.every((entry) => !groupOptionIds.has(entry)) ? current : next;
  }

  return [...current, optionId];
}

function getInitialActiveServiceId(
  services: ShopService[],
  initialServiceId?: string,
  bucket?: BookingBucketSelection[],
) {
  if (initialServiceId && services.some((service) => service.id === initialServiceId)) {
    return initialServiceId;
  }

  const firstBucketServiceId = Array.isArray(bucket)
    ? bucket.find((selection) => services.some((service) => service.id === selection.serviceId))?.serviceId
    : undefined;

  return firstBucketServiceId ?? "";
}

function estimateWeightFromLoads(loadCount: number, loadCapacityKg: number) {
  return Number(Math.max(0, loadCount * loadCapacityKg).toFixed(1));
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
