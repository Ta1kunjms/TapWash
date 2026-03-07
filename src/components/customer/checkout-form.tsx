"use client";

import { createOrderAction } from "@/app/actions/orders";
import { AddressAutocomplete } from "@/components/customer/address-autocomplete";
import { OrderStepper } from "@/components/customer/order-stepper";
import { Button } from "@/components/ui/button";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import {
  calculateServiceEstimate,
  formatOptionPriceDelta,
  formatServiceRateLabel,
  getDefaultSelectedOptionIds,
  getServiceLoadCapacityKg,
  resolveSelectedServiceOptions,
  type PricingOptionGroup,
  type PricingService,
} from "@/lib/pricing";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

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

type CheckoutFormProps = {
  shops: ShopItem[];
  initialShopId?: string;
  initialServiceId?: string;
  initialWeight?: number;
  initialPromoCode?: string;
};

const tipOptions = [0, 20, 50, 100];

export function CheckoutForm({
  shops,
  initialShopId,
  initialServiceId,
  initialWeight,
  initialPromoCode,
}: CheckoutFormProps) {
  const initialDraft = readCheckoutDraft(initialShopId ?? "", initialServiceId ?? "");
  const selectedShop = useMemo(
    () => shops.find((shop) => shop.id === initialShopId) ?? shops[0],
    [initialShopId, shops],
  );
  const selectedService = useMemo(() => {
    const services = selectedShop?.services ?? [];
    return services.find((service) => service.id === initialServiceId) ?? services[0];
  }, [initialServiceId, selectedShop]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(() => {
    if (!selectedService) {
      return sanitizeOptionIds(initialDraft?.selectedOptionIds);
    }

    const requested = sanitizeOptionIds(initialDraft?.selectedOptionIds);
    return resolveSelectedServiceOptions(
      selectedService,
      requested.length > 0 ? requested : getDefaultSelectedOptionIds(selectedService),
    ).map((option) => option.id);
  });

  const [pickupAddress, setPickupAddress] = useState(() => initialDraft?.pickupAddress ?? "");
  const [dropoffAddress, setDropoffAddress] = useState(() => initialDraft?.dropoffAddress ?? "");
  const [pickupDate, setPickupDate] = useState(() => initialDraft?.pickupDate ?? "");
  const [deliveryDate, setDeliveryDate] = useState(() => initialDraft?.deliveryDate ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "gcash" | "card">(() => initialDraft?.paymentMethod ?? "cod");
  const [promoCode, setPromoCode] = useState(() => initialDraft?.promoCode ?? initialPromoCode ?? "");
  const [contactPhone, setContactPhone] = useState(() => initialDraft?.contactPhone ?? "");
  const [deliveryInstructions, setDeliveryInstructions] = useState(() => initialDraft?.deliveryInstructions ?? "");
  const [riderNotes, setRiderNotes] = useState(() => initialDraft?.riderNotes ?? "");
  const [deliveryFee, setDeliveryFee] = useState<number>(49);
  const [tipAmount, setTipAmount] = useState<number>(() => initialDraft?.tipAmount ?? 20);
  const [customTip, setCustomTip] = useState(() => initialDraft?.customTip ?? "");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const [etaMax, setEtaMax] = useState<number | null>(null);
  const [quotedSignature, setQuotedSignature] = useState<string | null>(null);
  const [quoteErrorSignature, setQuoteErrorSignature] = useState<string | null>(null);
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);

  const weight = clampWeight(initialWeight ?? 3);
  const selectedServiceOptionGroups = selectedService?.service_option_groups ?? [];
  const normalizedSelectedOptionIds = useMemo(() => {
    if (!selectedService) {
      return [];
    }

    const requested = selectedOptionIds.length > 0 ? selectedOptionIds : getDefaultSelectedOptionIds(selectedService);
    return resolveSelectedServiceOptions(selectedService, requested).map((option) => option.id);
  }, [selectedOptionIds, selectedService]);
  const serviceEstimate = useMemo(() => {
    if (!selectedService) {
      return null;
    }

    return calculateServiceEstimate({
      service: selectedService,
      weightKg: weight,
      selectedOptionIds: normalizedSelectedOptionIds,
      shopLoadCapacityKg: selectedShop?.load_capacity_kg,
    });
  }, [normalizedSelectedOptionIds, selectedService, selectedShop?.load_capacity_kg, weight]);
  const loadCapacityKg = selectedService
    ? getServiceLoadCapacityKg(selectedService, selectedShop?.load_capacity_kg)
    : Number(selectedShop?.load_capacity_kg ?? 8);
  const loadCount = serviceEstimate?.loadCount ?? 1;
  const bookingHref = selectedShop?.id
    ? `/customer/orders/new?shopId=${encodeURIComponent(selectedShop.id)}`
    : "/customer/orders/new";

  const canRequestQuote = Boolean(pickupAddress.trim() && dropoffAddress.trim() && selectedShop?.location);
  const quoteSignature = `${selectedShop?.location ?? ""}|${pickupAddress.trim()}|${dropoffAddress.trim()}`;
  const hasRouteQuote = Boolean(
    canRequestQuote && quotedSignature === quoteSignature && distanceKm !== null && etaMin !== null && etaMax !== null,
  );
  const hasQuoteError = Boolean(canRequestQuote && quoteErrorSignature === quoteSignature && !hasRouteQuote);
  const isQuoteLoading = Boolean(canRequestQuote && !hasRouteQuote && !hasQuoteError);

  const basePrice = serviceEstimate?.basePrice ?? 0;
  const optionsTotal = serviceEstimate?.optionsTotal ?? 0;
  const subtotal = serviceEstimate?.subtotal ?? 0;
  const total = Number((subtotal + deliveryFee + tipAmount).toFixed(2));
  const isCheckoutReady = Boolean(
    selectedShop?.id &&
      selectedService?.id &&
      contactPhone.trim() &&
      pickupAddress.trim() &&
      dropoffAddress.trim() &&
      pickupDate &&
      deliveryDate &&
      hasRouteQuote,
  );

  useEffect(() => {
    if (!canRequestQuote) return;

    let isActive = true;
    const currentSignature = quoteSignature;

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch("/api/maps/quote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            pickupAddress,
            dropoffAddress,
            shopLocation: selectedShop?.location,
          }),
        });

        if (!response.ok) {
          if (isActive) {
            setQuoteErrorSignature(currentSignature);
          }
          return;
        }

        const result = (await response.json()) as {
          fee: number;
          etaMin: number;
          etaMax: number;
          distanceKm: number;
          pickup: { lat: number; lng: number };
          dropoff: { lat: number; lng: number };
        };

        if (!isActive) return;

        setDeliveryFee(result.fee);
        setEtaMin(result.etaMin);
        setEtaMax(result.etaMax);
        setDistanceKm(result.distanceKm);
        setPickupLat(result.pickup.lat);
        setPickupLng(result.pickup.lng);
        setDropoffLat(result.dropoff.lat);
        setDropoffLng(result.dropoff.lng);
        setQuotedSignature(currentSignature);
        setQuoteErrorSignature(null);
      } catch {
        if (isActive) {
          setQuoteErrorSignature(currentSignature);
        }
      }
    }, 450);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [canRequestQuote, dropoffAddress, pickupAddress, quoteSignature, selectedShop?.location]);

  useEffect(() => {
    if (!selectedShop?.id || !selectedService?.id || typeof window === "undefined") return;

    window.localStorage.setItem(
      getCheckoutDraftKey(selectedShop.id, selectedService.id),
      JSON.stringify({
        pickupAddress,
        dropoffAddress,
        pickupDate,
        deliveryDate,
        paymentMethod,
        promoCode,
        selectedOptionIds: normalizedSelectedOptionIds,
        contactPhone,
        deliveryInstructions,
        riderNotes,
        tipAmount,
        customTip,
      }),
    );
  }, [
    contactPhone,
    customTip,
    deliveryDate,
    deliveryInstructions,
    dropoffAddress,
    paymentMethod,
    pickupAddress,
    pickupDate,
    promoCode,
    riderNotes,
    normalizedSelectedOptionIds,
    selectedService?.id,
    selectedShop?.id,
    tipAmount,
  ]);

  if (!selectedShop || !selectedService) {
    return (
      <section className="rounded-[1.4rem] border border-[#c8dbea] bg-white/92 p-4 text-center shadow-[0_10px_24px_rgba(92,128,160,0.15)]">
        <p className="text-sm font-semibold text-[#4d6e8b]">Select a service from the booking page before proceeding to checkout.</p>
        <Link href={bookingHref} className="mt-3 inline-flex rounded-full bg-[#2196f3] px-4 py-2 text-sm font-bold text-white">
          Back to booking
        </Link>
      </section>
    );
  }

  return (
    <form action={createOrderAction} className="space-y-4 pb-40">
      <section className="rounded-[1.4rem] bg-[linear-gradient(135deg,#2196f3_0%,#3caaf0_100%)] px-5 py-4 shadow-[0_10px_24px_rgba(33,126,191,0.18)] flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <span className="inline-flex rounded-full bg-white/30 px-2 py-0.5 text-[0.72rem] font-black tracking-[0.18em] text-white">PRO</span>
          <p className="mt-2 text-base font-bold leading-tight text-white">Want free pickup and delivery with pro?</p>
          <p className="mt-1 text-[0.98rem] font-medium text-white/90">Subscribe from ₱35.00/month for faster repeats and member-only perks.</p>
        </div>
        <button type="button" className="shrink-0 rounded-full bg-white px-5 py-3 text-[1rem] font-bold text-[#2196f3] shadow-sm transition hover:bg-blue-50">
          See how
        </button>
      </section>
      <section className="-mx-4 rounded-b-[2rem] bg-[linear-gradient(180deg,#ddecfb_0%,#cce4fa_100%)] px-4 pb-5 pt-3 shadow-[0_12px_28px_rgba(90,140,184,0.18)]">
        <div className="flex items-start gap-3">
          <Link
            href={bookingHref}
            className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0081c9] transition hover:bg-white/40"
            aria-label="Go back to booking"
          >
            <FlaticonIcon name="angle-small-left" className="text-2xl" />
          </Link>

          <div className="min-w-0">
            <h1 className="text-[1.65rem] font-black leading-none text-[#2b4673]">Checkout</h1>
            <p className="mt-1 truncate text-sm font-semibold text-[#4aa3dd]">{selectedShop.shop_name}</p>
          </div>
        </div>

        <div className="mt-4">
          <OrderStepper currentStep={2} />
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-[#c8dbea] bg-white/92 p-4 shadow-[0_10px_24px_rgba(92,128,160,0.15)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#7aaed3]">Order summary</p>
            <h2 className="mt-1 text-lg font-black text-[#2c4f74]">{selectedService.name}</h2>
            <p className="mt-1 text-sm font-semibold text-[#69aedd]">{weight.toFixed(1)} kg · {loadCount} {loadCount === 1 ? "load" : "loads"} at {selectedShop.shop_name}</p>
            <p className="mt-1 text-xs font-semibold text-[#96bbd6]">{formatServiceRateLabel(selectedService, selectedShop.load_capacity_kg)}</p>
          </div>
          <div className="rounded-full bg-[#edf7ff] px-3 py-1.5 text-[0.76rem] font-black text-[#1f8fd6]">
            {formatCurrency(subtotal)}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[#edf7ff] px-3 py-1.5 font-black text-[#1f8fd6]">Machine load {loadCapacityKg.toFixed(0)} kg</span>
          <span className="rounded-full bg-[#edf7ff] px-3 py-1.5 font-black text-[#1f8fd6]">Base {formatCurrency(basePrice)}</span>
          {optionsTotal > 0 ? <span className="rounded-full bg-[#edf7ff] px-3 py-1.5 font-black text-[#1f8fd6]">Care options {formatCurrency(optionsTotal)}</span> : null}
        </div>
      </section>

      {selectedServiceOptionGroups.length > 0 ? (
        <section className="rounded-[1.6rem] border border-[#bfd7e8] bg-white p-4 shadow-[0_14px_30px_rgba(92,128,160,0.16)]">
          <div className="mb-4">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#7aaed3]">Care preferences</p>
            <h2 className="mt-1 text-lg font-black text-[#2c4f74]">Detergent, fabcon, and add-ons</h2>
          </div>

          <div className="space-y-4">
            {selectedServiceOptionGroups.map((group) => {
              const options = group.service_options ?? [];
              const selectedSet = new Set(normalizedSelectedOptionIds);

              return (
                <div key={group.id} className="space-y-2 rounded-[1.1rem] border border-[#d8e8f4] bg-[linear-gradient(180deg,#f8fcff_0%,#eef7ff_100%)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-[#2f5878]">{group.name}</p>
                      <p className="mt-1 text-xs text-[#6d90aa]">
                        {group.selection_type === "single" ? "Choose one option" : "Choose any extras"}
                        {group.is_required ? " · Required" : " · Optional"}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-black text-[#1f8fd6]">
                      {group.option_type.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {options.map((option) => {
                      const isSelected = selectedSet.has(option.id);

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setSelectedOptionIds((current) => updateSelectedOptionIds(current, group, option.id));
                          }}
                          className={cn(
                            "w-full rounded-[0.95rem] border px-3 py-3 text-left transition",
                            isSelected ? "border-[#2196f3] bg-[#eaf6ff]" : "border-[#d7e8f7] bg-white hover:border-[#9fcae8]",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-[#255375]">{option.name}</p>
                              {option.description ? <p className="mt-1 text-xs text-[#6d90aa]">{option.description}</p> : null}
                            </div>
                            <span className={cn("text-xs font-black", isSelected ? "text-[#0f7fd0]" : "text-[#7aaed3]")}>{formatOptionPriceDelta(option)}</span>
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

      <section className="rounded-[1.6rem] border border-[#bfd7e8] bg-white p-4 shadow-[0_14px_30px_rgba(92,128,160,0.16)]">
        <div className="mb-4">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#7aaed3]">Delivery details</p>
          <h2 className="mt-1 text-lg font-black text-[#2c4f74]">Pickup, route, and schedule</h2>
        </div>

        <div className="space-y-4">
          <AddressAutocomplete
            label="Pickup Address"
            name="pickupAddress"
            placeholder="House no., street, barangay"
            value={pickupAddress}
            onValueChange={setPickupAddress}
            onCoordinateSelect={(coordinates) => {
              setPickupLat(coordinates?.lat ?? null);
              setPickupLng(coordinates?.lng ?? null);
            }}
          />

          <AddressAutocomplete
            label="Drop-off Address"
            name="dropoffAddress"
            placeholder="Delivery return address"
            value={dropoffAddress}
            onValueChange={setDropoffAddress}
            onCoordinateSelect={(coordinates) => {
              setDropoffLat(coordinates?.lat ?? null);
              setDropoffLng(coordinates?.lng ?? null);
            }}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">Contact number</label>
              <Input
                required
                name="contactPhone"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                placeholder="09XXXXXXXXX"
                inputMode="tel"
                className="h-12 rounded-[1rem] border-[#cae4f8] bg-[#f9fdff]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">Pickup date and time</label>
              <Input
                required
                name="pickupDate"
                type="datetime-local"
                value={pickupDate}
                onChange={(event) => setPickupDate(event.target.value)}
                className="h-12 rounded-[1rem] border-[#cae4f8] bg-[#f9fdff]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">Delivery date and time</label>
              <Input
                required
                name="deliveryDate"
                type="datetime-local"
                value={deliveryDate}
                onChange={(event) => setDeliveryDate(event.target.value)}
                className="h-12 rounded-[1rem] border-[#cae4f8] bg-[#f9fdff]"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-text-secondary">
              Delivery instructions
              <textarea
                name="deliveryInstructions"
                value={deliveryInstructions}
                onChange={(event) => setDeliveryInstructions(event.target.value)}
                placeholder="Gate code, landmark, who can receive the order"
                className="mt-2 min-h-[96px] w-full rounded-[1rem] border border-[#cae4f8] bg-[#f9fdff] px-3 py-3 text-sm font-medium text-[#0d4b78] outline-none"
              />
            </label>

            <label className="block text-xs font-semibold text-text-secondary">
              Rider notes
              <textarea
                name="riderNotes"
                value={riderNotes}
                onChange={(event) => setRiderNotes(event.target.value)}
                placeholder="Fragile items, parking instructions, preferred call before arrival"
                className="mt-2 min-h-[96px] w-full rounded-[1rem] border border-[#cae4f8] bg-[#f9fdff] px-3 py-3 text-sm font-medium text-[#0d4b78] outline-none"
              />
            </label>
          </div>

          <div className="rounded-[1.2rem] border border-[#d8e8f4] bg-[linear-gradient(180deg,#f8fcff_0%,#eef7ff_100%)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#2f5878]">Map preview</p>
                <p className="mt-1 text-xs text-[#6d90aa]">Route quote updates automatically after both addresses are complete.</p>
              </div>
              <a
                className="rounded-full bg-[#2196f3] px-3 py-1.5 text-[0.72rem] font-black text-white"
                href={buildMapsHref(pickupLat, pickupLng, dropoffLat, dropoffLng)}
                target="_blank"
                rel="noreferrer"
              >
                Open in Maps
              </a>
            </div>

            <div className="mt-4 overflow-hidden rounded-[1rem] border border-[#d7e8f7] bg-white">
              <iframe
                title="Delivery route map"
                src={buildEmbedMapSrc(pickupLat, pickupLng, dropoffLat, dropoffLng)}
                className="h-44 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="mt-4 rounded-[1rem] bg-[radial-gradient(circle_at_top_left,#d8f0ff_0%,#edf7ff_48%,#f7fbff_100%)] p-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2196f3] text-white">
                  <FlaticonIcon name="marker" className="text-sm" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7aaed3]">Pickup</p>
                  <p className="mt-1 text-sm font-semibold text-[#355b7c]">{pickupAddress || "Add a pickup address"}</p>
                </div>
              </div>

              <div className="ml-[0.85rem] mt-2 h-8 w-[3px] rounded-full bg-[#a9d8fb]" />

              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#8ec9f7] text-white">
                  <FlaticonIcon name="home-location-alt" className="text-sm" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7aaed3]">Drop-off</p>
                  <p className="mt-1 text-sm font-semibold text-[#355b7c]">{dropoffAddress || "Add a drop-off address"}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-white px-3 py-1.5 font-bold text-[#1f8fd6]">{distanceKm !== null ? `${distanceKm.toFixed(1)} km` : "Distance pending"}</span>
              <span className="rounded-full bg-white px-3 py-1.5 font-bold text-[#1f8fd6]">
                {etaMin !== null && etaMax !== null ? `${etaMin}-${etaMax} mins` : "ETA pending"}
              </span>
              <span className="rounded-full bg-white px-3 py-1.5 font-bold text-[#1f8fd6]">Delivery fee {formatCurrency(deliveryFee)}</span>
            </div>

            {isQuoteLoading ? <p className="mt-3 text-xs text-[#7c9fb9]">Finalizing route quote...</p> : null}
            {hasQuoteError ? <p className="mt-3 text-xs text-red-500">Unable to calculate quote. Please refine your addresses.</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-[#bfd7e8] bg-white p-4 shadow-[0_14px_30px_rgba(92,128,160,0.16)]">
        <div className="mb-4">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#7aaed3]">Payment</p>
          <h2 className="mt-1 text-lg font-black text-[#2c4f74]">Tip and payment method</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold text-text-secondary">Rider tip</label>
            <div className="flex flex-wrap gap-2">
              {tipOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setTipAmount(option);
                    setCustomTip("");
                  }}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-black transition",
                    tipAmount === option && customTip === ""
                      ? "bg-[#2196f3] text-white"
                      : "bg-[#edf7ff] text-[#1f8fd6]",
                  )}
                >
                  {option === 0 ? "No tip" : formatCurrency(option)}
                </button>
              ))}
            </div>

            <label className="mt-3 block text-xs font-semibold text-text-secondary">
              Custom tip
              <Input
                value={customTip}
                onChange={(event) => {
                  const nextValue = event.target.value.replace(/[^0-9.]/g, "");
                  setCustomTip(nextValue);
                  setTipAmount(Number(nextValue || 0));
                }}
                placeholder="0.00"
                inputMode="decimal"
                className="mt-2 h-12 rounded-[1rem] border-[#cae4f8] bg-[#f9fdff]"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-text-secondary">
            Voucher code
            <Input
              name="promoCode"
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
              placeholder="WELCOME100"
              className="mt-2 h-12 rounded-[1rem] border-[#cae4f8] bg-[#f9fdff]"
            />
          </label>

          <div>
            <label className="mb-1 block text-xs font-semibold text-text-secondary">Payment method</label>
            <select
              name="paymentMethod"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as "cod" | "gcash" | "card")}
              className="h-12 w-full rounded-[1rem] border border-[#cae4f8] bg-[#f9fdff] px-3 text-sm font-semibold text-[#0d4b78] outline-none"
            >
              <option value="cod">Cash on Delivery</option>
              <option value="gcash">GCash</option>
              <option value="card">Card</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-[1.2rem] border border-[#c7d9e8] bg-white px-4 py-3.5 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
        <div className="space-y-2 text-sm">
          <SummaryRow label="Laundry base" value={formatCurrency(basePrice)} />
          {optionsTotal > 0 ? <SummaryRow label="Care options" value={formatCurrency(optionsTotal)} /> : null}
          <SummaryRow label="Delivery fee" value={formatCurrency(deliveryFee)} />
          <SummaryRow label="Tip" value={formatCurrency(tipAmount)} />
          <div className="h-px bg-[#dbe7f1]" />
          <SummaryRow label="Estimated total" value={formatCurrency(total)} strong />
        </div>
      </section>

      <input type="hidden" name="shopId" value={selectedShop.id} />
      <input type="hidden" name="serviceId" value={selectedService.id} />
      <input type="hidden" name="weightEstimate" value={weight} />
      <input type="hidden" name="selectedOptionIds" value={JSON.stringify(normalizedSelectedOptionIds)} />
      <input type="hidden" name="deliveryFee" value={deliveryFee} />
      <input type="hidden" name="tipAmount" value={tipAmount} />
      <input type="hidden" name="deliveryInstructions" value={deliveryInstructions} />
      <input type="hidden" name="riderNotes" value={riderNotes} />
      <input type="hidden" name="pickupLat" value={pickupLat ?? ""} />
      <input type="hidden" name="pickupLng" value={pickupLng ?? ""} />
      <input type="hidden" name="dropoffLat" value={dropoffLat ?? ""} />
      <input type="hidden" name="dropoffLng" value={dropoffLng ?? ""} />
      <input type="hidden" name="distanceKm" value={distanceKm ?? ""} />
      <input type="hidden" name="etaMinutes" value={etaMax ?? ""} />

      <CheckoutSubmitButton total={total} disabled={!isCheckoutReady} />
    </form>
  );
}

function CheckoutSubmitButton({ total, disabled }: { total: number; disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <div className="fixed bottom-[max(0.9rem,env(safe-area-inset-bottom))] left-0 right-0 z-30 px-4">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-[#1f7ec4] bg-[linear-gradient(140deg,#0085d1_0%,#2a9de2_58%,#47b2f3_100%)] p-2.5 shadow-[0_16px_36px_rgba(20,98,156,0.35)]">
        <Button
          type="submit"
          className="h-14 w-full justify-between rounded-[0.95rem] border border-white/25 bg-white/10 px-3 text-left text-white shadow-none hover:bg-white/15"
          disabled={disabled || pending}
        >
          <span className="flex flex-col">
            <span className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-white/85">Total</span>
            <span className="text-base font-black">{pending ? "..." : formatCurrency(total)}</span>
          </span>
          <span className="text-sm font-black">{pending ? "Confirming..." : disabled ? "Complete details" : "Confirm booking"}</span>
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn("text-[#5d7e97]", strong && "font-black text-[#2f5878]")}>{label}</span>
      <span className={cn("font-bold text-[#1f8fd6]", strong && "text-base")}>{value}</span>
    </div>
  );
}

function clampWeight(value: number) {
  return Number(Math.min(100, Math.max(1, value)).toFixed(1));
}

function formatCurrency(value: number) {
  return `₱${value.toFixed(2)}`;
}

function buildMapsHref(
  pickupLat: number | null,
  pickupLng: number | null,
  dropoffLat: number | null,
  dropoffLng: number | null,
) {
  if (pickupLat !== null && pickupLng !== null && dropoffLat !== null && dropoffLng !== null) {
    return `https://www.google.com/maps/dir/${pickupLat},${pickupLng}/${dropoffLat},${dropoffLng}`;
  }

  return "https://maps.google.com";
}

function buildEmbedMapSrc(
  pickupLat: number | null,
  pickupLng: number | null,
  dropoffLat: number | null,
  dropoffLng: number | null,
) {
  if (pickupLat !== null && pickupLng !== null && dropoffLat !== null && dropoffLng !== null) {
    return `https://maps.google.com/maps?saddr=${pickupLat},${pickupLng}&daddr=${dropoffLat},${dropoffLng}&z=13&output=embed`;
  }

  if (pickupLat !== null && pickupLng !== null) {
    return `https://maps.google.com/maps?q=${pickupLat},${pickupLng}&z=14&output=embed`;
  }

  return "https://maps.google.com/maps?q=General%20Santos%20City&z=12&output=embed";
}

function getCheckoutDraftKey(shopId: string, serviceId: string) {
  return `tapwash.checkoutDraft.${shopId}.${serviceId}`;
}

function sanitizeOptionIds(value: string[] | undefined) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
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

function readCheckoutDraft(
  shopId: string,
  serviceId: string,
): {
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupDate?: string;
  deliveryDate?: string;
  paymentMethod?: "cod" | "gcash" | "card";
  promoCode?: string;
  contactPhone?: string;
  deliveryInstructions?: string;
  riderNotes?: string;
  selectedOptionIds?: string[];
  tipAmount?: number;
  customTip?: string;
} | null {
  if (!shopId || !serviceId || typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getCheckoutDraftKey(shopId, serviceId));
    if (!raw) return null;
    return JSON.parse(raw) as {
      pickupAddress?: string;
      dropoffAddress?: string;
      pickupDate?: string;
      deliveryDate?: string;
      paymentMethod?: "cod" | "gcash" | "card";
      promoCode?: string;
      contactPhone?: string;
      deliveryInstructions?: string;
      riderNotes?: string;
      selectedOptionIds?: string[];
      tipAmount?: number;
      customTip?: string;
    };
  } catch {
    return null;
  }
}