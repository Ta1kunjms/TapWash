"use client";

import { createOrderAction } from "@/app/actions/orders";
import { AddressAutocomplete } from "@/components/customer/address-autocomplete";
import { OrderStepper } from "@/components/customer/order-stepper";
import { Button } from "@/components/ui/button";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import {
  calculateServiceEstimate,
  formatServiceRateLabel,
  getDefaultSelectedOptionIds,
  getEstimatedLoadCount,
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
  initialBucket?: CheckoutBucketSelection[];
  initialPromoCode?: string;
  initialSelectedAddress?: {
    addressLine: string;
    lat: number;
    lng: number;
  } | null;
  initialSavedAddresses?: string[];
};

type CheckoutBucketSelection = {
  serviceId: string;
  loads: number;
  selectedOptionIds?: string[];
};

type CheckoutBucketEstimate = {
  serviceId: string;
  service: ShopService;
  loads: number;
  weightKg: number;
  loadCapacityKg: number;
  selectedOptionIds: string[];
  estimate: ReturnType<typeof calculateServiceEstimate>;
};

const SAVED_ADDRESSES_KEY = "tapwash.savedAddresses";

export function CheckoutForm({
  shops,
  initialShopId,
  initialServiceId,
  initialWeight,
  initialBucket,
  initialPromoCode,
  initialSelectedAddress,
  initialSavedAddresses,
}: CheckoutFormProps) {
  const selectedShop = useMemo(
    () => shops.find((shop) => shop.id === initialShopId) ?? shops[0],
    [initialShopId, shops],
  );
  const initialBucketSelections = useMemo(
    () => normalizeBucketSelections(selectedShop?.services ?? [], initialBucket, initialServiceId, initialWeight, selectedShop?.load_capacity_kg),
    [initialBucket, initialServiceId, initialWeight, selectedShop?.load_capacity_kg, selectedShop?.services],
  );
  const fallbackServiceId = initialBucketSelections[0]?.serviceId ?? "";
  const defaultActiveServiceId = initialBucketSelections.some((selection) => selection.serviceId === initialServiceId)
    ? (initialServiceId ?? "")
    : fallbackServiceId;
  const initialDraft = readCheckoutDraft(initialShopId ?? "", defaultActiveServiceId);
  const [activeServiceId] = useState<string>(() => initialDraft?.activeServiceId ?? defaultActiveServiceId);
  const selectedService = useMemo(() => {
    const services = selectedShop?.services ?? [];
    if (services.some((service) => service.id === activeServiceId)) {
      return services.find((service) => service.id === activeServiceId) ?? null;
    }

    return services.find((service) => service.id === fallbackServiceId) ?? null;
  }, [activeServiceId, fallbackServiceId, selectedShop]);
  const [selectedOptionIdsByService] = useState<Record<string, string[]>>(() =>
    buildInitialSelectedOptionIdsByService(initialBucketSelections, selectedShop?.services ?? [], initialDraft),
  );

  const [pickupAddress, setPickupAddress] = useState(() => initialDraft?.pickupAddress ?? initialSelectedAddress?.addressLine ?? "");
  const [dropoffAddress, setDropoffAddress] = useState(() => initialDraft?.dropoffAddress ?? initialSelectedAddress?.addressLine ?? "");
  const [pickupDate, setPickupDate] = useState(() => initialDraft?.pickupDate ?? getDefaultPickupDateTime());
  const [deliveryDate, setDeliveryDate] = useState(() => initialDraft?.deliveryDate ?? getDefaultDeliveryDateTime());
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
  const [pickupLat, setPickupLat] = useState<number | null>(initialSelectedAddress?.lat ?? null);
  const [pickupLng, setPickupLng] = useState<number | null>(initialSelectedAddress?.lng ?? null);
  const [dropoffLat, setDropoffLat] = useState<number | null>(initialSelectedAddress?.lat ?? null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(initialSelectedAddress?.lng ?? null);
  const [savedAddresses] = useState<string[]>(() =>
    uniqueAddresses([...(initialSavedAddresses ?? []), ...loadSavedAddressesFromStorage()]),
  );
  const [addressMenuOpen, setAddressMenuOpen] = useState(false);
  const [showManualAddressFields, setShowManualAddressFields] = useState(
    () => !initialSelectedAddress && (initialSavedAddresses?.length ?? 0) === 0,
  );
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [resolvedPromoCode, setResolvedPromoCode] = useState<string | null>(null);
  const selectableAddresses = useMemo(
    () => uniqueAddresses([pickupAddress, dropoffAddress, ...savedAddresses]),
    [dropoffAddress, pickupAddress, savedAddresses],
  );
  const normalizedContactPhone = useMemo(() => normalizePhilippinePhone(contactPhone), [contactPhone]);

  const bucketEstimates = useMemo(
    () =>
      initialBucketSelections
        .map((selection) => {
          const service = (selectedShop?.services ?? []).find((entry) => entry.id === selection.serviceId);
          if (!service) {
            return null;
          }

          const loadCapacityKg = getServiceLoadCapacityKg(service, selectedShop?.load_capacity_kg);
          const weightKg = estimateWeightFromLoads(selection.loads, loadCapacityKg);
          const requestedOptionIds = selectedOptionIdsByService[service.id] ?? getDefaultSelectedOptionIds(service);
          const normalizedOptionIds = resolveSelectedServiceOptions(service, requestedOptionIds).map((option) => option.id);

          return {
            serviceId: service.id,
            service,
            loads: selection.loads,
            weightKg,
            loadCapacityKg,
            selectedOptionIds: normalizedOptionIds,
            estimate: calculateServiceEstimate({
              service,
              weightKg,
              selectedOptionIds: normalizedOptionIds,
              shopLoadCapacityKg: selectedShop?.load_capacity_kg,
            }),
          } satisfies CheckoutBucketEstimate;
        })
        .filter((entry): entry is CheckoutBucketEstimate => entry !== null),
    [initialBucketSelections, selectedOptionIdsByService, selectedShop?.load_capacity_kg, selectedShop?.services],
  );
  const bookingParams = new URLSearchParams();
  if (selectedShop?.id) {
    bookingParams.set("shopId", selectedShop.id);
  }
  if (selectedService?.id) {
    bookingParams.set("serviceId", selectedService.id);
  }
  if (initialBucketSelections.length > 0) {
    bookingParams.set("bucket", JSON.stringify(initialBucketSelections));
  }
  const bookingHref = `/customer/orders/new?${bookingParams.toString()}`;

  const canRequestQuote = Boolean(pickupAddress.trim() && dropoffAddress.trim() && selectedShop?.location);
  const quoteSignature = `${selectedShop?.location ?? ""}|${pickupAddress.trim()}|${dropoffAddress.trim()}`;
  const hasRouteQuote = Boolean(
    canRequestQuote && quotedSignature === quoteSignature && distanceKm !== null && etaMin !== null && etaMax !== null,
  );
  const hasQuoteError = Boolean(canRequestQuote && quoteErrorSignature === quoteSignature && !hasRouteQuote);
  const isQuoteLoading = Boolean(canRequestQuote && !hasRouteQuote && !hasQuoteError);

  const basePrice = Number(bucketEstimates.reduce((sum, entry) => sum + entry.estimate.basePrice, 0).toFixed(2));
  const optionsTotal = Number(bucketEstimates.reduce((sum, entry) => sum + entry.estimate.optionsTotal, 0).toFixed(2));
  const subtotal = Number(bucketEstimates.reduce((sum, entry) => sum + entry.estimate.subtotal, 0).toFixed(2));
  const totalLoads = bucketEstimates.reduce((sum, entry) => sum + entry.loads, 0);
  const totalWeight = Number(bucketEstimates.reduce((sum, entry) => sum + entry.weightKg, 0).toFixed(1));
  const totalBeforeDiscount = Number((subtotal + deliveryFee + tipAmount).toFixed(2));
  const total = Number(Math.max(0, totalBeforeDiscount - promoDiscount).toFixed(2));
  const isCheckoutReady = Boolean(
    selectedShop?.id &&
      bucketEstimates.length > 0 &&
      normalizedContactPhone &&
      pickupAddress.trim() &&
      dropoffAddress.trim() &&
      pickupDate &&
      deliveryDate &&
      hasRouteQuote,
  );

  useEffect(() => {
    const normalizedPromoCode = promoCode.trim().toUpperCase();

    if (!normalizedPromoCode) {
      setPromoDiscount(0);
      setResolvedPromoCode(null);
      return;
    }

    let isActive = true;
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch("/api/vouchers/estimate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            code: normalizedPromoCode,
            subtotal,
          }),
        });

        if (!response.ok) {
          if (isActive) {
            setPromoDiscount(0);
            setResolvedPromoCode(null);
          }
          return;
        }

        const result = (await response.json()) as { promoCode: string | null; discount: number };
        if (!isActive) return;

        setPromoDiscount(Number((result.discount ?? 0).toFixed(2)));
        setResolvedPromoCode(result.promoCode);
      } catch {
        if (isActive) {
          setPromoDiscount(0);
          setResolvedPromoCode(null);
        }
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [promoCode, subtotal]);

  useEffect(() => {
    if (!canRequestQuote) return;

    let isActive = true;
    const currentSignature = quoteSignature;

    const timeoutId = setTimeout(async () => {
      try {
        const maxAttempts = 3;
        let attempt = 0;
        let result: {
          fee: number;
          etaMin: number;
          etaMax: number;
          distanceKm: number;
          pickup: { lat: number; lng: number };
          dropoff: { lat: number; lng: number };
        } | null = null;

        while (attempt < maxAttempts && isActive) {
          attempt += 1;

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

            if (response.ok) {
              result = (await response.json()) as {
                fee: number;
                etaMin: number;
                etaMax: number;
                distanceKm: number;
                pickup: { lat: number; lng: number };
                dropoff: { lat: number; lng: number };
              };
              break;
            }

            // Avoid retrying deterministic client-side errors except rate limits.
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
              break;
            }
          } catch {
            // Retry transient network failures below.
          }

          if (attempt < maxAttempts && isActive) {
            await sleep(attempt * 400);
          }
        }

        if (!isActive || !result) {
          if (isActive) {
            setQuoteErrorSignature(currentSignature);
          }
          return;
        }

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
        activeServiceId: selectedService.id,
        pickupAddress,
        dropoffAddress,
        pickupDate,
        deliveryDate,
        paymentMethod,
        promoCode,
        selectedOptionIdsByService,
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
    selectedOptionIdsByService,
    selectedService?.id,
    selectedShop?.id,
    tipAmount,
  ]);

  useEffect(() => {
    const onLocationUpdated = (event: Event) => {
      const custom = event as CustomEvent<{
        addressLine?: string;
        label?: string;
        lat?: number;
        lng?: number;
        cleared?: boolean;
      }>;

      if (custom.detail?.cleared) {
        setPickupAddress("");
        setDropoffAddress("");
        setPickupLat(null);
        setPickupLng(null);
        setDropoffLat(null);
        setDropoffLng(null);
        return;
      }

      const nextAddress = custom.detail?.addressLine?.trim() || custom.detail?.label?.trim() || "";
      if (!nextAddress) return;

      setPickupAddress(nextAddress);
      setDropoffAddress(nextAddress);

      if (typeof custom.detail?.lat === "number" && typeof custom.detail?.lng === "number") {
        setPickupLat(custom.detail.lat);
        setPickupLng(custom.detail.lng);
        setDropoffLat(custom.detail.lat);
        setDropoffLng(custom.detail.lng);
      }
    };

    window.addEventListener("tapwash:location-updated", onLocationUpdated as EventListener);
    return () => window.removeEventListener("tapwash:location-updated", onLocationUpdated as EventListener);
  }, []);

  if (!selectedShop || bucketEstimates.length === 0 || !selectedService) {
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
      <section className="-mx-4 rounded-b-[2rem] bg-[linear-gradient(180deg,#ddecfb_0%,#cce4fa_100%)] px-4 pb-5 pt-3 shadow-[0_12px_28px_rgba(90,140,184,0.18)]">
        <div className="relative flex items-center justify-center">
          <Link
            href={bookingHref}
            className="absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0081c9] transition hover:bg-white/40"
            aria-label="Go back to booking"
          >
            <FlaticonIcon name="angle-small-left" className="text-2xl" />
          </Link>

          <div className="min-w-0 px-12 text-center">
            <h1 className="text-[1.25rem] font-black leading-[0.92] text-[#233f6e]">Checkout</h1>
            <p className="mt-1 truncate text-[1rem] font-bold text-[#1f93d8]">{selectedShop.shop_name}</p>
          </div>
        </div>

        <div className="mt-4">
          <OrderStepper currentStep={2} />
        </div>
      </section>


      {/* Unified receipt card moved to end of page */}

      <section className="mt-4">
        <div className="mb-4">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#7aaed3]">Delivery details</p>
          <h2 className="mt-1 text-lg font-black text-[#2c4f74]">Pickup and delivery schedule</h2>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.1rem] border border-[#b7c6d1] bg-white px-3.5 py-3 shadow-[0_4px_10px_rgba(94,126,150,0.08)]">
            <button
              type="button"
              onClick={() => setAddressMenuOpen((current) => !current)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-3 text-[#1083c7]">
                <FlaticonIcon name="navigation" className="text-[1.25rem]" />
                <p className="truncate text-[1.05rem] font-bold leading-tight">{selectedShop.shop_name}</p>
              </div>
              <div className="my-2.5 h-px bg-[#c4d2dc]" />
              <div className="flex items-center gap-3 text-[#1083c7]">
                <FlaticonIcon name="marker" className="text-[1.25rem]" />
                <p className="line-clamp-1 text-[0.98rem] font-bold leading-tight">
                  {dropoffAddress || pickupAddress || "Tap to choose my address"}
                </p>
              </div>
            </button>

            {addressMenuOpen ? (
              <div className="mt-3 space-y-2 rounded-[0.85rem] border border-[#d7e8f4] bg-[#f7fbff] p-2.5">
                {selectableAddresses.length > 0 ? (
                  selectableAddresses.map((address) => (
                    <button
                      key={address}
                      type="button"
                      onClick={() => {
                        setPickupAddress(address);
                        setDropoffAddress(address);
                        setAddressMenuOpen(false);
                      }}
                      className="w-full rounded-[0.7rem] border border-[#d2e6f5] bg-white px-3 py-2 text-left text-[0.78rem] font-semibold text-[#2f5878] transition hover:border-[#9fcae8]"
                    >
                      {address}
                    </button>
                  ))
                ) : (
                  <p className="rounded-[0.7rem] bg-white px-3 py-2 text-[0.78rem] font-semibold text-[#6d90aa]">
                    No saved addresses yet. Add one in the Location page.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setShowManualAddressFields((current) => !current)}
                  className="w-full rounded-[0.7rem] border border-[#9fcae8] bg-[#edf7ff] px-3 py-2 text-[0.76rem] font-black text-[#1f8fd6]"
                >
                  {showManualAddressFields ? "Hide manual address fields" : "Use different pickup/drop-off address"}
                </button>
              </div>
            ) : null}
          </div>

          <DateTimeCard
            title="Pick-up Date and Time"
            icon="clock"
            dateValue={extractDatePart(pickupDate)}
            timeValue={extractTimePart(pickupDate)}
            onDateChange={(nextDate) => {
              const fallbackTime = extractTimePart(pickupDate) || "08:00";
              const nextPickupDate = composeDateTime(nextDate, fallbackTime);
              setPickupDate(nextPickupDate);
              setDeliveryDate((currentDelivery) => ensureDeliveryAfterPickup(nextPickupDate, currentDelivery));
            }}
            onTimeChange={(nextTime) => {
              const fallbackDate = extractDatePart(pickupDate) || getTodayDate();
              const nextPickupDate = composeDateTime(fallbackDate, nextTime);
              setPickupDate(nextPickupDate);
              setDeliveryDate((currentDelivery) => ensureDeliveryAfterPickup(nextPickupDate, currentDelivery));
            }}
          />

          <DateTimeCard
            title="Delivery Date and Time"
            icon="home-location-alt"
            dateValue={extractDatePart(deliveryDate)}
            timeValue={extractTimePart(deliveryDate)}
            onDateChange={(nextDate) => {
              const fallbackTime = extractTimePart(deliveryDate) || "09:00";
              setDeliveryDate(composeDateTime(nextDate, fallbackTime));
            }}
            onTimeChange={(nextTime) => {
              const fallbackDate = extractDatePart(deliveryDate) || getTodayDate();
              setDeliveryDate(composeDateTime(fallbackDate, nextTime));
            }}
          />
        </div>

        <div className="space-y-4">
          {showManualAddressFields ? (
            <>
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
            </>
          ) : null}



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
            <p className="text-sm font-black text-[#2f5878]">Route quote</p>
            <p className="mt-1 text-xs text-[#6d90aa]">Estimated from your pickup and drop-off addresses.</p>

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

      <section className="rounded-[1.35rem] border border-[#d5e3ee] bg-white p-4 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
        <div className="mb-4">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#7aaed3]">Tips</p>
          <h2 className="mt-1 text-lg font-black text-[#2c4f74]">Tip your rider</h2>
          <p className="mt-1 text-[0.78rem] font-semibold text-[#7a97ad]">
            100% of the tips go to your rider, we don&apos;t deduct anything from it.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[0, 5, 20, 40, 80].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setTipAmount(option);
                  setCustomTip("");
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[0.76rem] font-black transition",
                  tipAmount === option && customTip === ""
                    ? "border-[#2f8ecf] bg-[#2f8ecf] text-white"
                    : "border-[#d8e5ef] bg-[#f6fbff] text-[#4f6d84]",
                )}
              >
                {option === 0 ? "Not now" : formatCurrency(option)}
              </button>
            ))}
          </div>

          <label className="mt-2 block text-xs font-semibold text-text-secondary">
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
              className="mt-2 h-11 rounded-[0.9rem] border-[#d8e5ef] bg-[#f8fcff]"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-[0.78rem] font-semibold text-[#5c7b93]">
            <input type="checkbox" className="h-4 w-4 rounded border-[#c8dbea] text-[#2f8ecf]" />
            Save for your next order
          </label>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-[#2c4f74]">Payment method</h2>
          <button
            type="button"
            onClick={() => setShowPaymentOptions((current) => !current)}
            className="rounded-full bg-[#edf7ff] px-3 py-1 text-[0.74rem] font-black text-[#2f8ecf]"
          >
            Change
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1rem] border border-[#d9e7f2] bg-[#f8fcff] px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#1f8fd6] text-[0.62rem] font-black text-white">
                  {paymentMethod === "gcash" ? "GC" : paymentMethod === "card" ? "CC" : "COD"}
                </span>
                <div>
                  <p className="text-[0.84rem] font-black text-[#2f5878]">{formatPaymentMethodLabel(paymentMethod)}</p>
                  <p className="text-[0.72rem] font-semibold text-[#7a97ad]">{formatPaymentMethodHint(paymentMethod, normalizedContactPhone)}</p>
                </div>
              </div>
              <p className="text-[0.84rem] font-black text-[#2f5878]">{formatCurrency(total)}</p>
            </div>
          </div>

          {showPaymentOptions ? (
            <div className="flex flex-wrap gap-2 rounded-[0.95rem] border border-[#dbe7f1] bg-[#fbfdff] p-2.5">
              {([
                { value: "cod", label: "Cash on Delivery" },
                { value: "gcash", label: "GCash" },
                { value: "card", label: "Card" },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(option.value);
                    setShowPaymentOptions(false);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[0.76rem] font-black transition",
                    paymentMethod === option.value
                      ? "border-[#2f8ecf] bg-[#2f8ecf] text-white"
                      : "border-[#d8e5ef] bg-[#f6fbff] text-[#4f6d84]",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

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

        </div>
      </section>

      <section id="order-summary" className="rounded-[1.1rem] border border-[#c7d9e8] bg-white px-4 py-3.5 shadow-[0_8px_18px_rgba(92,128,160,0.12)] mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[0.98rem] font-black text-[#2f5878]">Order summary</h2>
          <span className="text-[0.78rem] font-bold text-[#7a98ae]">#{selectedShop.id.slice(0, 6).toUpperCase()}</span>
        </div>

        <div className="mt-2 flex items-start justify-between gap-3">
          <p className="text-[0.76rem] font-semibold text-[#6d90aa]">
            {bucketEstimates.length > 0
              ? `${totalLoads} x ${bucketEstimates[0]?.service.name}${bucketEstimates.length > 1 ? ` +${bucketEstimates.length - 1} more` : ""}`
              : "No selected services"}
          </p>
          <p className="text-[0.78rem] font-bold text-[#6d90aa]">{formatCurrency(subtotal)}</p>
        </div>

        <div className="mt-3 space-y-1.5 border-t border-[#dbe7f1] pt-2.5 text-[0.82rem]">
          <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
          <SummaryRow label="Standard delivery" value={formatCurrency(deliveryFee)} />
          {optionsTotal > 0 ? <SummaryRow label="Service fee" value={formatCurrency(optionsTotal)} /> : null}
          <SummaryRow label="Tip" value={formatCurrency(tipAmount)} />
          {promoDiscount > 0 ? <SummaryRow label="Promo savings" value={`-${formatCurrency(promoDiscount)}`} /> : null}
        </div>
      </section>

      {isSummaryOpen ? (
        <div
          className="fixed inset-0 z-40 bg-[#0b2b43]/35 px-4"
          onClick={() => setIsSummaryOpen(false)}
          role="presentation"
        >
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-[1.4rem] border border-[#c7d9e8] bg-white p-4 shadow-[0_-10px_28px_rgba(33,126,191,0.22)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Order summary details"
          >
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#dbe7f1] pb-2.5">
              <h3 className="text-[1rem] font-black text-[#2f5878]">Order summary</h3>
              <button
                type="button"
                onClick={() => setIsSummaryOpen(false)}
                className="rounded-full bg-[#edf7ff] px-3 py-1 text-[0.72rem] font-black text-[#2f8ecf]"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-[0.88rem]">
              {bucketEstimates.length > 0 ? (
                <div className="mb-2 space-y-1.5 rounded-[0.9rem] border border-[#dbe7f1] bg-[#f7fbff] p-2.5">
                  {bucketEstimates.map((entry) => (
                    <div key={entry.serviceId} className="flex items-start justify-between gap-2 text-[0.82rem]">
                      <span className="font-semibold text-[#4c6d87]">
                        {entry.loads}x {entry.service.name}
                      </span>
                      <span className="font-bold text-[#2f8ecf]">{formatCurrency(entry.estimate.subtotal)}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
              <SummaryRow label="Standard delivery" value={formatCurrency(deliveryFee)} />
              {optionsTotal > 0 ? <SummaryRow label="Service fee" value={formatCurrency(optionsTotal)} /> : null}
              <SummaryRow label="Tip" value={formatCurrency(tipAmount)} />
              <SummaryRow label="Fees and tax" value="Included" />
              {promoDiscount > 0 ? <SummaryRow label="Promo savings" value={`-${formatCurrency(promoDiscount)}`} /> : null}
              {distanceKm !== null ? <SummaryRow label="Distance" value={`${distanceKm.toFixed(1)} km`} /> : null}
              {etaMin !== null && etaMax !== null ? <SummaryRow label="ETA" value={`${etaMin}-${etaMax} mins`} /> : null}
              <SummaryRow label="Payment" value={formatPaymentMethodLabel(paymentMethod)} />
              {promoCode.trim()
                ? (
                  <SummaryRow
                    label="Promo code"
                    value={resolvedPromoCode ? `${resolvedPromoCode} applied` : `${promoCode.trim().toUpperCase()} not eligible`}
                  />
                )
                : null}
              <div className="h-px bg-[#dbe7f1]" />
              <SummaryRow label="Total payable" value={formatCurrency(total)} strong />
            </div>
          </div>
        </div>
      ) : null}

      <input type="hidden" name="bucket" value={JSON.stringify(initialBucketSelections)} />
      <input type="hidden" name="shopId" value={selectedShop.id} />
      <input type="hidden" name="serviceId" value={selectedService.id} />
      <input type="hidden" name="contactPhone" value={normalizedContactPhone ?? contactPhone.trim()} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <input type="hidden" name="pickupDate" value={pickupDate} />
      <input type="hidden" name="deliveryDate" value={deliveryDate} />
      <input type="hidden" name="weightEstimate" value={totalWeight} />
      <input type="hidden" name="selectedOptionIds" value={JSON.stringify(bucketEstimates.flatMap((entry) => entry.selectedOptionIds))} />
      <input
        type="hidden"
        name="serviceSelections"
        value={JSON.stringify(
          bucketEstimates.map((entry) => ({
            serviceId: entry.serviceId,
            loads: entry.loads,
            selectedOptionIds: entry.selectedOptionIds,
          })),
        )}
      />
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

      <CheckoutSubmitButton
        disabled={!isCheckoutReady}
        total={total}
        onSeeSummary={() => setIsSummaryOpen(true)}
      />
    </form>
  );
}

function CheckoutSubmitButton({
  disabled,
  total,
  onSeeSummary,
}: {
  disabled: boolean;
  total: number;
  onSeeSummary: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="fixed left-0 right-0 bottom-0 z-30 pointer-events-none">
      <div className="pointer-events-auto w-full bg-gradient-to-b from-[#eaf5ff] to-[#d6eafd] shadow-[0_-8px_32px_0_rgba(33,126,191,0.18),0_-1.5px_0_0_#c7d9e8] pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col items-stretch">
        <div className="flex items-center justify-between mb-3 px-4">
          <div className="flex flex-col leading-tight">
            <span className="text-[1.08rem] text-[#217ebf]">
              <span className="font-bold">Total</span>
              <span className="font-medium ml-1 text-[#5d7e97]">(incl. fees and tax)</span>
            </span>
            <button
              type="button"
              onClick={onSeeSummary}
              className="mt-0.5 w-fit text-[0.78rem] font-semibold text-[#2f8ecf] hover:underline"
            >
              See summary
            </button>
          </div>
          <span className="text-[1.08rem] font-bold text-[#43a9eb]">{formatCurrency(total)}</span>
        </div>
        <Button
          type="submit"
          className={cn(
            "mx-4 flex h-12 items-center justify-center rounded-full bg-[#43a9eb] px-8 text-center text-[1.2rem] font-bold leading-none text-white shadow-[0_12px_26px_rgba(33,126,191,0.35)] transition hover:bg-[#389fdf]",
            disabled && "opacity-70",
          )}
          disabled={disabled || pending}
        >
          {pending ? "Booking..." : disabled ? "Complete details" : "Book Now"}
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
  return Number(Math.min(250, Math.max(0, value)).toFixed(1));
}

function formatCurrency(value: number) {
  return `₱${value.toFixed(2)}`;
}

function formatPaymentMethodLabel(method: "cod" | "gcash" | "card") {
  switch (method) {
    case "cod":
      return "Cash on Delivery";
    case "gcash":
      return "GCash";
    case "card":
      return "Card";
    default:
      return "Cash on Delivery";
  }
}

function formatPaymentMethodHint(method: "cod" | "gcash" | "card", normalizedContactPhone: string | null) {
  if (method === "gcash") {
    return normalizedContactPhone ?? "63-9***-****";
  }

  if (method === "card") {
    return "**** **** **** 4242";
  }

  return "Pay when rider arrives";
}

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function DateTimeCard({
  title,
  icon,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
}: {
  title: string;
  icon: string;
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}) {
  const today = startOfDay(new Date());
  const maxSelectableDate = addDays(today, 15);
  const selectedDate = clampDate(parseInputDate(dateValue) ?? today, today, maxSelectableDate);
  const [monthOffset, setMonthOffset] = useState(0);
  const displayMonthDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + monthOffset,
    1,
  );
  const minMonthIndex = today.getFullYear() * 12 + today.getMonth();
  const maxMonthIndex = maxSelectableDate.getFullYear() * 12 + maxSelectableDate.getMonth();
  const displayMonthIndex = displayMonthDate.getFullYear() * 12 + displayMonthDate.getMonth();
  const canGoPrevMonth = displayMonthIndex > minMonthIndex;
  const canGoNextMonth = displayMonthIndex < maxMonthIndex;

  const days = buildCalendarGrid(displayMonthDate, selectedDate, today, maxSelectableDate);

  return (
    <div className="rounded-[1.2rem] border border-[#c8def0] bg-[linear-gradient(180deg,#fafdff_0%,#eef7ff_100%)] p-3.5 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
      <div className="mb-3 flex items-center gap-2 text-[#1f8fd6]">
        <FlaticonIcon name={icon} className="text-base" />
        <p className="text-[1rem] font-black">{title}</p>
      </div>

      <div className="mb-3 rounded-[0.95rem] border border-[#d2e6f5] bg-white p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (!canGoPrevMonth) return;
              setMonthOffset((current) => current - 1);
            }}
            disabled={!canGoPrevMonth}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full transition",
              canGoPrevMonth
                ? "bg-[#edf7ff] text-[#2f8ecf] hover:bg-[#dff0ff]"
                : "cursor-not-allowed bg-[#f4f9fd] text-[#b8ccdc]",
            )}
            aria-label="Previous month"
          >
            <FlaticonIcon name="angle-small-left" className="text-sm" />
          </button>
          <p className="text-[0.76rem] font-black uppercase tracking-[0.12em] text-[#2f8ecf]">
            {displayMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
          <button
            type="button"
            onClick={() => {
              if (!canGoNextMonth) return;
              setMonthOffset((current) => current + 1);
            }}
            disabled={!canGoNextMonth}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full transition",
              canGoNextMonth
                ? "bg-[#edf7ff] text-[#2f8ecf] hover:bg-[#dff0ff]"
                : "cursor-not-allowed bg-[#f4f9fd] text-[#b8ccdc]",
            )}
            aria-label="Next month"
          >
            <FlaticonIcon name="angle-small-right" className="text-sm" />
          </button>
        </div>

        <div className="grid grid-cols-7 overflow-hidden rounded-[0.75rem] border border-[#d8e8f4]">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className={cn(
                "py-1.5 text-center text-[0.68rem] font-black",
                label === "Sat" || label === "Sun"
                  ? "bg-[#178fd4] text-white"
                  : "bg-[#e9f5ff] text-[#2f5878]",
              )}
            >
              {label}
            </div>
          ))}

          {days.map((day) => (
            <button
              key={day.key}
              type="button"
              onClick={() => {
                if (day.isDisabled) return;
                onDateChange(toInputDate(day.date));
                setMonthOffset(0);
              }}
              disabled={day.isDisabled}
              className={cn(
                "h-9 border-t border-[#e6f1fa] text-[0.78rem] font-black transition",
                !day.inCurrentMonth && "bg-[#f7fbff] text-[#c0d5e6]",
                day.inCurrentMonth && !day.isDisabled && "bg-white text-[#2f8ecf] hover:bg-[#edf7ff]",
                day.isDisabled && "cursor-not-allowed bg-[#f5f9fd] text-[#c8d6e2]",
                day.isToday && "ring-1 ring-inset ring-[#90c6e8]",
                day.isSelected && "bg-[#178fd4] text-white",
              )}
            >
              {day.date.getDate()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[0.66rem] font-black uppercase tracking-[0.12em] text-[#7aaed3]">Time</label>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {TIME_SLOTS.map((slot) => {
            const isActive = slot === timeValue;

            return (
              <button
                key={slot}
                type="button"
                onClick={() => onTimeChange(slot)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-[0.95rem] font-black transition",
                  isActive
                    ? "border-[#218ed2] bg-[#218ed2] text-white"
                    : "border-[#a9d2ef] bg-white text-[#2f8ecf] hover:border-[#8bc2e7]",
                )}
              >
                {formatSlotTime(slot)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalDateTimeInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getDefaultPickupDateTime() {
  const now = new Date();
  const rounded = new Date(now.getTime());
  rounded.setMinutes(0, 0, 0);
  rounded.setHours(Math.max(8, rounded.getHours() + 1));
  return toLocalDateTimeInputValue(rounded);
}

function getDefaultDeliveryDateTime() {
  const pickup = new Date(getDefaultPickupDateTime());
  pickup.setHours(pickup.getHours() + 4);
  return toLocalDateTimeInputValue(pickup);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}

function clampDate(value: Date, minDate: Date, maxDate: Date) {
  if (value.getTime() < minDate.getTime()) {
    return minDate;
  }

  if (value.getTime() > maxDate.getTime()) {
    return maxDate;
  }

  return value;
}

function parseInputDate(value: string) {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  return startOfDay(parsed);
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendarGrid(monthDate: Date, selectedDate: Date, today: Date, maxDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstDayMondayIndex = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - firstDayMondayIndex);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = firstDayMondayIndex + daysInMonth <= 35 ? 35 : 42;

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const normalizedDate = startOfDay(date);
    const isOutsideRange = normalizedDate.getTime() < today.getTime() || normalizedDate.getTime() > maxDate.getTime();

    return {
      key: `${normalizedDate.getFullYear()}-${normalizedDate.getMonth()}-${normalizedDate.getDate()}`,
      date: normalizedDate,
      inCurrentMonth: normalizedDate.getMonth() === month,
      isDisabled: isOutsideRange,
      isToday: isSameDay(normalizedDate, today),
      isSelected: isSameDay(normalizedDate, selectedDate),
    };
  });
}

function extractDatePart(value: string) {
  return value?.includes("T") ? value.split("T")[0] : "";
}

function extractTimePart(value: string) {
  return value?.includes("T") ? value.split("T")[1]?.slice(0, 5) ?? "" : "";
}

function composeDateTime(date: string, time: string) {
  if (!date || !time) {
    return "";
  }

  return `${date}T${time}`;
}

function ensureDeliveryAfterPickup(pickup: string, delivery: string) {
  const pickupTime = Date.parse(pickup);
  const deliveryTime = Date.parse(delivery);

  if (Number.isNaN(pickupTime)) {
    return delivery;
  }

  if (Number.isNaN(deliveryTime) || deliveryTime < pickupTime) {
    return toLocalDateTimeInputValue(new Date(pickupTime + 60 * 60 * 1000));
  }

  return delivery;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizePhoneInput(value: string) {
  const cleaned = value.replace(/[^\d+]/g, "");
  if (!cleaned) {
    return "";
  }

  if (cleaned.startsWith("+")) {
    return `+${cleaned.slice(1).replace(/\+/g, "")}`;
  }

  return cleaned;
}

function normalizePhilippinePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");

  if (/^09\d{9}$/.test(digits)) {
    return `+63${digits.slice(1)}`;
  }

  if (/^9\d{9}$/.test(digits)) {
    return `+63${digits}`;
  }

  if (/^63\d{10}$/.test(digits)) {
    return `+${digits}`;
  }

  return null;
}

function formatSlotTime(value: string) {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = minuteRaw ?? "00";
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${suffix}`;
}

function estimateWeightFromLoads(loads: number, loadCapacityKg: number) {
  return clampWeight(loads * loadCapacityKg);
}

function getCheckoutDraftKey(shopId: string, serviceId: string) {
  return `tapwash.checkoutDraft.${shopId}.${serviceId}`;
}

function sanitizeOptionIds(value: string[] | undefined) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function uniqueAddresses(values: string[]) {
  const normalized = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return Array.from(new Set(normalized));
}

function loadSavedAddressesFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SAVED_ADDRESSES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function buildInitialSelectedOptionIdsByService(
  bucketSelections: CheckoutBucketSelection[],
  services: ShopService[],
  draft:
    | {
        activeServiceId?: string;
        selectedOptionIdsByService?: Record<string, string[]>;
      }
    | null,
) {
  return bucketSelections.reduce<Record<string, string[]>>((result, selection) => {
    const service = services.find((entry) => entry.id === selection.serviceId);
    if (!service) {
      return result;
    }

    const requestedFromDraft = sanitizeOptionIds(draft?.selectedOptionIdsByService?.[service.id]);
    const requestedFromBucket = sanitizeOptionIds(selection.selectedOptionIds);
    const requested = requestedFromDraft.length > 0 ? requestedFromDraft : requestedFromBucket;
    result[service.id] = resolveSelectedServiceOptions(
      service,
      requested.length > 0 ? requested : getDefaultSelectedOptionIds(service),
    ).map((option) => option.id);
    return result;
  }, {});
}

function normalizeBucketSelections(
  services: ShopService[],
  bucket: CheckoutBucketSelection[] | undefined,
  initialServiceId: string | undefined,
  initialWeight: number | undefined,
  shopLoadCapacityKg: number | undefined,
) {
  const bucketSelections = Array.isArray(bucket)
    ? bucket
        .filter((selection) => selection.loads > 0 && services.some((service) => service.id === selection.serviceId))
        .map((selection) => ({
          serviceId: selection.serviceId,
          loads: Math.min(20, Math.max(1, Math.round(selection.loads))),
          selectedOptionIds: sanitizeOptionIds(selection.selectedOptionIds),
        }))
    : [];

  if (bucketSelections.length > 0) {
    return bucketSelections;
  }

  const fallbackService = services.find((service) => service.id === initialServiceId) ?? services[0];
  if (!fallbackService) {
    return [];
  }

  const loadCapacityKg = getServiceLoadCapacityKg(fallbackService, shopLoadCapacityKg);
  const fallbackLoads = initialWeight && initialWeight > 0 ? getEstimatedLoadCount(initialWeight, loadCapacityKg) : 1;

  return [{
    serviceId: fallbackService.id,
    loads: Math.min(20, Math.max(1, fallbackLoads)),
    selectedOptionIds: [],
  }];
}

function readCheckoutDraft(
  shopId: string,
  serviceId: string,
): {
  activeServiceId?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupDate?: string;
  deliveryDate?: string;
  paymentMethod?: "cod" | "gcash" | "card";
  promoCode?: string;
  contactPhone?: string;
  deliveryInstructions?: string;
  riderNotes?: string;
  selectedOptionIdsByService?: Record<string, string[]>;
  tipAmount?: number;
  customTip?: string;
} | null {
  if (!shopId || !serviceId || typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getCheckoutDraftKey(shopId, serviceId));
    if (!raw) return null;
    return JSON.parse(raw) as {
      activeServiceId?: string;
      pickupAddress?: string;
      dropoffAddress?: string;
      pickupDate?: string;
      deliveryDate?: string;
      paymentMethod?: "cod" | "gcash" | "card";
      promoCode?: string;
      contactPhone?: string;
      deliveryInstructions?: string;
      riderNotes?: string;
      selectedOptionIdsByService?: Record<string, string[]>;
      tipAmount?: number;
      customTip?: string;
    };
  } catch {
    return null;
  }
}

