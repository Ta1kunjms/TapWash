"use client";

import { AddressAutocomplete } from "@/components/customer/address-autocomplete";
import { CheckoutMapPreviewSection } from "@/components/customer/checkout-map-preview-section";
import { CheckoutPaymentSection } from "@/components/customer/checkout-payment-section";
import { OrderStepper } from "@/components/customer/order-stepper";
import { Button } from "@/components/ui/button";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import {
  calculateServiceEstimate,
  getDefaultSelectedOptionIds,
  getEstimatedLoadCount,
  getServiceLoadCapacityKg,
  resolveSelectedServiceOptions,
  type PricingOptionGroup,
  type PricingService,
} from "@/lib/pricing";
import { Input } from "@/components/ui/input";
import type { CustomerPaymentPreference } from "@/types/domain";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type PaymentMethod = "cod" | "gcash" | "card";
type VoucherStatus = "idle" | "applied" | "invalid" | "error";
type RoutePoint = { lat: number; lng: number };

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

export type CheckoutFormProps = {
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
  initialContactPhone?: string;
  initialPaymentMethod?: PaymentMethod;
  initialPaymentPreferences?: CustomerPaymentPreference[];
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
  initialContactPhone,
  initialPaymentMethod,
  initialPaymentPreferences = [],
}: CheckoutFormProps) {
  const router = useRouter();
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
  const [pickupAddressValid, setPickupAddressValid] = useState<boolean>(
    () => Boolean(initialSelectedAddress?.lat && initialSelectedAddress?.lng)
  );
  const [dropoffAddress, setDropoffAddress] = useState(() => initialDraft?.dropoffAddress ?? initialSelectedAddress?.addressLine ?? "");
  const [dropoffAddressValid, setDropoffAddressValid] = useState<boolean>(
    () => Boolean(initialSelectedAddress?.lat && initialSelectedAddress?.lng)
  );
  const [pickupDate, setPickupDate] = useState(() => initialDraft?.pickupDate ?? getDefaultPickupDateTime());
  const [deliveryDate, setDeliveryDate] = useState(() => initialDraft?.deliveryDate ?? getDefaultDeliveryDateTime());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => initialDraft?.paymentMethod ?? initialPaymentMethod ?? "cod");
  const [promoCode, setPromoCode] = useState(() => initialDraft?.promoCode ?? initialPromoCode ?? "");
  const [contactPhone, setContactPhone] = useState(() => initialDraft?.contactPhone ?? initialContactPhone ?? "");
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
  const [quoteErrorMessage, setQuoteErrorMessage] = useState<string | null>(null);
  const [pickupLat, setPickupLat] = useState<number | null>(initialSelectedAddress?.lat ?? null);
  const [pickupLng, setPickupLng] = useState<number | null>(initialSelectedAddress?.lng ?? null);
  const [dropoffLat, setDropoffLat] = useState<number | null>(initialSelectedAddress?.lat ?? null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(initialSelectedAddress?.lng ?? null);
  const [shopLat, setShopLat] = useState<number | null>(null);
  const [shopLng, setShopLng] = useState<number | null>(null);
  const [, setRoutePath] = useState<RoutePoint[]>([]);
  const [shopToPickupPath, setShopToPickupPath] = useState<RoutePoint[]>([]);
  const [shopToPickupDistanceKm, setShopToPickupDistanceKm] = useState<number | null>(null);
  const [quoteRetryToken, setQuoteRetryToken] = useState(0);
  const [savedAddresses] = useState<string[]>(() =>
    uniqueAddresses([...(initialSavedAddresses ?? []), ...loadSavedAddressesFromStorage()]),
  );
  const [addressMenuOpen, setAddressMenuOpen] = useState(false);
  const [showManualAddressFields, setShowManualAddressFields] = useState(
    () => !initialSelectedAddress && (initialSavedAddresses?.length ?? 0) === 0,
  );
  const [useSameDropoff, setUseSameDropoff] = useState<boolean>(
    () => initialDraft?.useSameDropoff ?? true,
  );
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"pickup" | "delivery" | null>("pickup");
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(() => {
    const fromDraft = initialDraft?.promoCode?.trim().toUpperCase();
    return fromDraft ? fromDraft : null;
  });
  const [resolvedPromoCode, setResolvedPromoCode] = useState<string | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [voucherStatus, setVoucherStatus] = useState<VoucherStatus>("idle");
  const [voucherMessage, setVoucherMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectableAddresses = useMemo(
    () => uniqueAddresses([pickupAddress, dropoffAddress, ...savedAddresses]),
    [dropoffAddress, pickupAddress, savedAddresses],
  );
  const normalizedContactPhone = useMemo(() => normalizePhilippinePhone(contactPhone), [contactPhone]);
  const customerShopDistanceKm = useMemo(() => {
    if (pickupLat === null || pickupLng === null || shopLat === null || shopLng === null) {
      return null;
    }

    return haversineDistanceKm({ lat: pickupLat, lng: pickupLng }, { lat: shopLat, lng: shopLng });
  }, [pickupLat, pickupLng, shopLat, shopLng]);

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

  const canRequestQuote = Boolean(
    pickupAddress.trim().length >= 5 &&
    dropoffAddress.trim().length >= 5 &&
    pickupAddressValid &&
    dropoffAddressValid &&
    selectedShop?.location?.trim().length
  );
  const quoteSignature = `${selectedShop?.location ?? ""}|${pickupAddress.trim()}|${dropoffAddress.trim()}|${pickupLat ?? ""},${pickupLng ?? ""}|${dropoffLat ?? ""},${dropoffLng ?? ""}`;
  const hasRouteQuote = Boolean(
    canRequestQuote && quotedSignature === quoteSignature && distanceKm !== null && etaMin !== null && etaMax !== null,
  );
  const hasQuoteError = Boolean(canRequestQuote && quoteErrorSignature === quoteSignature && !hasRouteQuote);
  const isQuoteLoading = Boolean(canRequestQuote && !hasRouteQuote && !hasQuoteError);

  const optionsTotal = Number(bucketEstimates.reduce((sum, entry) => sum + entry.estimate.optionsTotal, 0).toFixed(2));
  const subtotal = Number(bucketEstimates.reduce((sum, entry) => sum + entry.estimate.subtotal, 0).toFixed(2));
  const totalLoads = bucketEstimates.reduce((sum, entry) => sum + entry.loads, 0);
  const totalWeight = Number(bucketEstimates.reduce((sum, entry) => sum + entry.weightKg, 0).toFixed(1));
  const totalBeforeDiscount = Number((subtotal + deliveryFee + tipAmount).toFixed(2));
  const total = Number(Math.max(0, totalBeforeDiscount - promoDiscount).toFixed(2));
  const effectiveScheduleMode = scheduleMode ?? "pickup";
  const scheduleDateTime = effectiveScheduleMode === "pickup" ? pickupDate : deliveryDate;
  const scheduleDateValue = extractDatePart(scheduleDateTime) || getTodayDate();
  const scheduleTimeValue = extractTimePart(scheduleDateTime) || (effectiveScheduleMode === "pickup" ? "08:00" : "09:00");
  const scheduleMinimumDateTime =
    effectiveScheduleMode === "pickup" ? toLocalDateTimeInputValue(new Date()) : pickupDate;
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

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isCheckoutReady || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json() as { redirectTo?: string };

      if (payload.redirectTo) {
        router.push(payload.redirectTo);
        router.refresh();
        return;
      }

      router.push("/customer/orders/checkout?error=Unable+to+create+booking.+Please+review+your+details+and+try+again.");
      router.refresh();
    } catch {
      router.push("/customer/orders/checkout?error=Unable+to+create+booking.+Please+review+your+details+and+try+again.");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }, [isCheckoutReady, isSubmitting, router]);

  const handleScheduleDateChange = useCallback((nextDate: string) => {
    const mode = scheduleMode ?? "pickup";

    if (mode === "pickup") {
      const fallbackTime = extractTimePart(pickupDate) || "08:00";
      const nextPickupDate = composeDateTime(nextDate, fallbackTime);
      setPickupDate(nextPickupDate);
      setDeliveryDate((currentDelivery) => ensureDeliveryAfterPickup(nextPickupDate, currentDelivery));
      return;
    }

    const fallbackTime = extractTimePart(deliveryDate) || "09:00";
    setDeliveryDate(ensureDeliveryAfterPickup(pickupDate, composeDateTime(nextDate, fallbackTime)));
  }, [deliveryDate, pickupDate, scheduleMode]);

  const handleScheduleTimeChange = useCallback((nextTime: string) => {
    const mode = scheduleMode ?? "pickup";

    if (mode === "pickup") {
      const fallbackDate = extractDatePart(pickupDate) || getTodayDate();
      const nextPickupDate = composeDateTime(fallbackDate, nextTime);
      setPickupDate(nextPickupDate);
      setDeliveryDate((currentDelivery) => ensureDeliveryAfterPickup(nextPickupDate, currentDelivery));
      return;
    }

    const fallbackDate = extractDatePart(deliveryDate) || getTodayDate();
    setDeliveryDate(ensureDeliveryAfterPickup(pickupDate, composeDateTime(fallbackDate, nextTime)));
  }, [deliveryDate, pickupDate, scheduleMode]);

  const estimateVoucher = useCallback(async (code: string) => {
    const response = await fetch("/api/vouchers/estimate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code,
        subtotal,
      }),
    });

    if (!response.ok) {
      throw new Error("Voucher estimate failed");
    }

    const result = (await response.json()) as { promoCode: string | null; discount: number };
    return {
      promoCode: result.promoCode,
      discount: Number((result.discount ?? 0).toFixed(2)),
    };
  }, [subtotal]);

  async function handleApplyVoucher() {
    const normalizedPromoCode = promoCode.trim().toUpperCase();

    if (!normalizedPromoCode) {
      setPromoDiscount(0);
      setResolvedPromoCode(null);
      setAppliedPromoCode(null);
      setVoucherStatus("idle");
      setVoucherMessage(null);
      return;
    }

    setIsApplyingVoucher(true);
    setVoucherStatus("idle");
    setVoucherMessage("Applying voucher...");

    try {
      const result = await estimateVoucher(normalizedPromoCode);

      if (!result.promoCode || result.discount <= 0) {
        setPromoDiscount(0);
        setResolvedPromoCode(null);
        setAppliedPromoCode(null);
        setVoucherStatus("invalid");
        setVoucherMessage("Voucher is not eligible for this order.");
        return;
      }

      setPromoCode(result.promoCode);
      setPromoDiscount(result.discount);
      setResolvedPromoCode(result.promoCode);
      setAppliedPromoCode(result.promoCode);
      setVoucherStatus("applied");
      setVoucherMessage(`${result.promoCode} applied: -${formatCurrency(result.discount)}`);
    } catch {
      setPromoDiscount(0);
      setResolvedPromoCode(null);
      setAppliedPromoCode(null);
      setVoucherStatus("error");
      setVoucherMessage("Could not apply voucher right now. Please try again.");
    } finally {
      setIsApplyingVoucher(false);
    }
  }

  useEffect(() => {
    if (!appliedPromoCode) {
      return;
    }

    let isActive = true;

    void (async () => {
      try {
        const result = await estimateVoucher(appliedPromoCode);
        if (!isActive) return;

        if (!result.promoCode || result.discount <= 0) {
          setPromoDiscount(0);
          setResolvedPromoCode(null);
          setAppliedPromoCode(null);
          setVoucherStatus("invalid");
          setVoucherMessage("Applied voucher is no longer eligible for this total.");
          return;
        }

        setPromoDiscount(result.discount);
        setResolvedPromoCode(result.promoCode);
        setVoucherStatus("applied");
        setVoucherMessage(`${result.promoCode} applied: -${formatCurrency(result.discount)}`);
      } catch {
        if (!isActive) return;
        setVoucherStatus("error");
        setVoucherMessage("Could not refresh voucher discount.");
      }
    })();

    return () => {
      isActive = false;
    };
  }, [appliedPromoCode, estimateVoucher]);

  useEffect(() => {
    if (!canRequestQuote) {
      setQuoteErrorSignature(null);
      setQuoteErrorMessage(null);
      setShopLat(null);
      setShopLng(null);
      setRoutePath([]);
      setShopToPickupPath([]);
      setShopToPickupDistanceKm(null);
    }
  }, [canRequestQuote]);

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
          shop: { lat: number; lng: number };
          routePath: RoutePoint[];
          shopToPickupPath: RoutePoint[];
          shopToPickupDistanceKm: number | null;
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
                pickupLat,
                pickupLng,
                dropoffLat,
                dropoffLng,
                pickupDate,
                deliveryDate,
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
                shop: { lat: number; lng: number };
                routePath: RoutePoint[];
                shopToPickupPath: RoutePoint[];
                shopToPickupDistanceKm: number | null;
              };
              break;
            }

            // Avoid retrying deterministic client-side errors except rate limits.
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
              const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
              if (isActive) {
                setQuoteErrorMessage(errorBody?.error ?? "Please verify the selected addresses and try again.");
              }
              break;
            }

            if (response.status >= 500 && response.status !== 429) {
              const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
              if (isActive) {
                setQuoteErrorMessage(errorBody?.error ?? "Quote service is temporarily unavailable. Please try again.");
              }
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
            setQuotedSignature(null);
            setDistanceKm(null);
            setEtaMin(null);
            setEtaMax(null);
            setShopLat(null);
            setShopLng(null);
            setRoutePath([]);
            setShopToPickupPath([]);
            setShopToPickupDistanceKm(null);
            setQuoteErrorMessage((current) => current ?? "Unable to calculate delivery fee. Please refine your addresses.");
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
        setShopLat(result.shop.lat);
        setShopLng(result.shop.lng);
        setRoutePath(Array.isArray(result.routePath) ? result.routePath : []);
        setShopToPickupPath(Array.isArray(result.shopToPickupPath) ? result.shopToPickupPath : []);
        setShopToPickupDistanceKm(
          typeof result.shopToPickupDistanceKm === "number" ? result.shopToPickupDistanceKm : null,
        );
        setQuotedSignature(currentSignature);
        setQuoteErrorSignature(null);
        setQuoteErrorMessage(null);
      } catch {
        if (isActive) {
          setQuoteErrorSignature(currentSignature);
          setQuotedSignature(null);
          setDistanceKm(null);
          setEtaMin(null);
          setEtaMax(null);
          setShopLat(null);
          setShopLng(null);
          setRoutePath([]);
          setShopToPickupPath([]);
          setShopToPickupDistanceKm(null);
          setQuoteErrorMessage("Unable to calculate delivery fee. Please refine your addresses.");
        }
      }
    }, 450);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [
    canRequestQuote,
    deliveryDate,
    dropoffAddress,
    dropoffLat,
    dropoffLng,
    pickupAddress,
    pickupDate,
    pickupLat,
    pickupLng,
    quoteRetryToken,
    quoteSignature,
    selectedShop?.location,
  ]);

  useEffect(() => {
    if (!useSameDropoff) return;

    setDropoffAddress(pickupAddress);
    setDropoffLat(pickupLat);
    setDropoffLng(pickupLng);
    setDropoffAddressValid(pickupAddressValid);
  }, [pickupAddress, pickupAddressValid, pickupLat, pickupLng, useSameDropoff]);

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
        useSameDropoff,
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
    useSameDropoff,
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
        if (useSameDropoff) {
          setDropoffAddress("");
        }
        setPickupLat(null);
        setPickupLng(null);
        if (useSameDropoff) {
          setDropoffLat(null);
          setDropoffLng(null);
        }
        return;
      }

      const nextAddress = custom.detail?.addressLine?.trim() || custom.detail?.label?.trim() || "";
      if (!nextAddress) return;

      setPickupAddress(nextAddress);
      if (useSameDropoff) {
        setDropoffAddress(nextAddress);
      }
      setPickupAddressValid(nextAddress.length >= 5);
      if (useSameDropoff) {
        setDropoffAddressValid(nextAddress.length >= 5);
      }

      if (typeof custom.detail?.lat === "number" && typeof custom.detail?.lng === "number") {
        setPickupLat(custom.detail.lat);
        setPickupLng(custom.detail.lng);
        if (useSameDropoff) {
          setDropoffLat(custom.detail.lat);
          setDropoffLng(custom.detail.lng);
        }
        setPickupAddressValid(true);
        if (useSameDropoff) {
          setDropoffAddressValid(true);
        }
      }
    };

    window.addEventListener("tapwash:location-updated", onLocationUpdated as EventListener);
    return () => window.removeEventListener("tapwash:location-updated", onLocationUpdated as EventListener);
  }, [useSameDropoff]);

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
    <form onSubmit={handleSubmit} className="space-y-3 pb-44">
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

      <CheckoutMapPreviewSection
        shopName={selectedShop.shop_name}
        roadDistanceKm={shopToPickupDistanceKm ?? customerShopDistanceKm}
        pickupLat={pickupLat}
        pickupLng={pickupLng}
        shopLat={shopLat}
        shopLng={shopLng}
        routePath={shopToPickupPath}
      />

      <section className="rounded-[1.2rem] border border-[#cfe3f2] bg-white p-4 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7aaed3]">Service summary</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[1rem] font-black text-[#2f5878]">{selectedService.name}</h2>
            <p className="truncate text-[0.8rem] font-semibold text-[#6d90aa]">{selectedShop.shop_name}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#eaf5ff] px-3 py-1 text-[0.72rem] font-black text-[#1f8fd6]">
            {totalLoads > 0 ? `${totalLoads} load${totalLoads > 1 ? "s" : ""}` : "1 load"}
          </span>
        </div>
        {totalWeight > 0 ? <p className="mt-2 text-[0.76rem] font-semibold text-[#6d90aa]">Estimated {totalWeight.toFixed(1)} kg</p> : null}
      </section>

      <section className="rounded-[1.2rem] border border-[#cfe3f2] bg-white p-4 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7aaed3]">Schedule</p>

        <div className="mt-3 space-y-3">
          <button
            type="button"
            onClick={() => setScheduleMode((current) => (current === "pickup" ? null : "pickup"))}
            className={cn(
              "flex w-full items-center justify-between rounded-[0.95rem] px-4 py-2.5 text-left transition",
              scheduleMode === "pickup"
                ? "bg-[#2f8ecf] text-white shadow-[0_8px_20px_rgba(33,126,191,0.26)]"
                : "border border-[#cfe3f2] bg-[#f7fbff] text-[#2f5878] hover:border-[#9fcae8]",
            )}
          >
            <span className="text-[1.05rem] font-black">Pickup: {formatScheduleDateTime(pickupDate)}</span>
            <FlaticonIcon
              name="angle-small-down"
              className={cn("text-lg transition-transform", scheduleMode === "pickup" ? "rotate-180" : "")}
            />
          </button>

          {scheduleMode === "pickup" ? (
            <>
              <div className="rounded-[1.2rem] border border-[#cfe3f2] bg-[#f8fcff] p-3">
                <ScheduleCalendarPanel
                  key={`${scheduleMode}-${scheduleDateValue}`}
                  value={scheduleDateValue}
                  minimumDateTime={scheduleMinimumDateTime}
                  onChange={handleScheduleDateChange}
                />
              </div>

              <div className="rounded-[1.2rem] border border-[#cfe3f2] bg-white p-3">
                <p className="text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#5d8cb0]">Time</p>
                <p className="mt-1 text-[0.8rem] font-semibold text-[#6d90aa]">Choose a time slot for the selected date.</p>
                <ScheduleTimePanel
                  dateValue={scheduleDateValue}
                  value={scheduleTimeValue}
                  minimumDateTime={scheduleMinimumDateTime}
                  onChange={handleScheduleTimeChange}
                />
              </div>

              <button
                type="button"
                onClick={() => setScheduleMode("delivery")}
                className="w-full rounded-[0.95rem] border border-[#b9d7ec] bg-[#edf7ff] px-4 py-2 text-[0.82rem] font-black text-[#2f8ecf]"
              >
                Done with pickup, continue to delivery
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => setScheduleMode((current) => (current === "delivery" ? null : "delivery"))}
            className={cn(
              "flex w-full items-center justify-between rounded-[0.95rem] px-4 py-2.5 text-left transition",
              scheduleMode === "delivery"
                ? "bg-[#2f8ecf] text-white shadow-[0_8px_20px_rgba(33,126,191,0.26)]"
                : "border border-[#cfe3f2] bg-[#f7fbff] text-[#2f5878] hover:border-[#9fcae8]",
            )}
          >
            <span className="text-[1.05rem] font-black">Delivery: {formatScheduleDateTime(deliveryDate)}</span>
            <FlaticonIcon
              name="angle-small-down"
              className={cn("text-lg transition-transform", scheduleMode === "delivery" ? "rotate-180" : "")}
            />
          </button>

          {scheduleMode === "delivery" ? (
            <>
              <div className="rounded-[1.2rem] border border-[#cfe3f2] bg-[#f8fcff] p-3">
                <ScheduleCalendarPanel
                  key={`${scheduleMode}-${scheduleDateValue}`}
                  value={scheduleDateValue}
                  minimumDateTime={scheduleMinimumDateTime}
                  onChange={handleScheduleDateChange}
                />
              </div>

              <div className="rounded-[1.2rem] border border-[#cfe3f2] bg-white p-3">
                <p className="text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#5d8cb0]">Time</p>
                <p className="mt-1 text-[0.8rem] font-semibold text-[#6d90aa]">Choose a time slot for the selected date.</p>
                <ScheduleTimePanel
                  dateValue={scheduleDateValue}
                  value={scheduleTimeValue}
                  minimumDateTime={scheduleMinimumDateTime}
                  onChange={handleScheduleTimeChange}
                />
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className="rounded-[1.2rem] border border-[#cfe3f2] bg-white p-4 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7aaed3]">Location</p>
          </div>
          <button
            type="button"
            onClick={() => setAddressMenuOpen((current) => !current)}
            className="rounded-full bg-[#edf7ff] px-3 py-1 text-[0.74rem] font-black text-[#2f8ecf]"
          >
            {addressMenuOpen ? "Done" : "Change"}
          </button>
        </div>

        <div className="mb-2 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.08em]",
              useSameDropoff
                ? "bg-[#eaf5ff] text-[#2f8ecf]"
                : "bg-[#eef7ef] text-[#2e8a49]",
            )}
          >
            {useSameDropoff ? "Same pickup and delivery" : "Different pickup and delivery"}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setUseSameDropoff(true);
              setDropoffAddress(pickupAddress);
              setDropoffLat(pickupLat);
              setDropoffLng(pickupLng);
              setDropoffAddressValid(pickupAddressValid);
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[0.72rem] font-black uppercase tracking-[0.08em] transition",
              useSameDropoff
                ? "border-[#2f8ecf] bg-[#2f8ecf] text-white"
                : "border-[#cbe1f1] bg-white text-[#5d8cb0] hover:border-[#9fcae8]",
            )}
          >
            Same address
          </button>
          <button
            type="button"
            onClick={() => {
              setUseSameDropoff(false);
              if (dropoffAddress.trim().length === 0) {
                setDropoffAddress("");
                setDropoffLat(null);
                setDropoffLng(null);
                setDropoffAddressValid(false);
              }
            }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[0.72rem] font-black uppercase tracking-[0.08em] transition",
              !useSameDropoff
                ? "border-[#2e8a49] bg-[#2e8a49] text-white"
                : "border-[#cbe1f1] bg-white text-[#5d8cb0] hover:border-[#9fcae8]",
            )}
          >
            Different delivery
          </button>
        </div>

        <div className="space-y-2">
          <div className="rounded-[0.9rem] border border-[#d8e8f4] bg-[#f9fcff] px-3 py-2.5">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.1em] text-[#6d90aa]">Pickup address</p>
            <p className="mt-1 text-sm font-semibold text-[#2f5878]">{pickupAddress || "No pickup address selected yet"}</p>
          </div>

          <div className="rounded-[0.9rem] border border-[#d8e8f4] bg-[#f9fcff] px-3 py-2.5">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.1em] text-[#6d90aa]">Delivery address</p>
            <p className="mt-1 text-sm font-semibold text-[#2f5878]">
              {dropoffAddress || "No delivery address selected yet"}
              {dropoffAddress && pickupAddress && dropoffAddress === pickupAddress ? " (same as pickup)" : ""}
            </p>
          </div>
        </div>

        {addressMenuOpen ? (
          <div className="mt-3 space-y-2 rounded-[0.85rem] border border-[#d7e8f4] bg-[#f7fbff] p-2.5">
            {selectableAddresses.length > 0 ? (
              selectableAddresses.map((address) => (
                <button
                  key={address}
                  type="button"
                  onClick={() => {
                    setPickupAddress(address);
                    setPickupLat(null);
                    setPickupLng(null);
                    setPickupAddressValid(true);
                    if (useSameDropoff) {
                      setDropoffAddress(address);
                      setDropoffLat(null);
                      setDropoffLng(null);
                      setDropoffAddressValid(true);
                    }
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

        {showManualAddressFields ? (
          <div className="mt-3 grid gap-3">
            <AddressAutocomplete
              label="Pickup Address"
              name="pickupAddress"
              placeholder="House no., street, barangay"
              value={pickupAddress}
              onValueChange={(val) => {
                setPickupAddress(val);
                setPickupLat(null);
                setPickupLng(null);
                setPickupAddressValid(false);
              }}
              onCoordinateSelect={(coordinates) => {
                setPickupLat(coordinates?.lat ?? null);
                setPickupLng(coordinates?.lng ?? null);
                setPickupAddressValid(!!coordinates && typeof coordinates.lat === "number" && typeof coordinates.lng === "number");
              }}
            />
            {!pickupAddressValid && (
              <span className="text-xs text-red-500">Select a pickup suggestion so we can calculate an accurate route.</span>
            )}

            {!useSameDropoff ? (
              <>
                <AddressAutocomplete
                  label="Drop-off Address"
                  name="dropoffAddress"
                  placeholder="Delivery return address"
                  value={dropoffAddress}
                  onValueChange={(val) => {
                    setDropoffAddress(val);
                    setDropoffLat(null);
                    setDropoffLng(null);
                    setDropoffAddressValid(false);
                  }}
                  onCoordinateSelect={(coordinates) => {
                    setDropoffLat(coordinates?.lat ?? null);
                    setDropoffLng(coordinates?.lng ?? null);
                    setDropoffAddressValid(!!coordinates && typeof coordinates.lat === "number" && typeof coordinates.lng === "number");
                  }}
                />
                {!dropoffAddressValid && (
                  <span className="text-xs text-red-500">Select a drop-off suggestion so we can calculate an accurate route.</span>
                )}
              </>
            ) : (
              <p className="text-xs font-semibold text-[#6d90aa]">Drop-off will use your pickup address for this booking.</p>
            )}
          </div>
        ) : null}

        <label className="mt-3 block text-xs font-semibold text-text-secondary">
          Contact number
          <Input
            value={contactPhone}
            onChange={(event) => setContactPhone(sanitizePhoneInput(event.target.value))}
            placeholder="09XXXXXXXXX"
            inputMode="tel"
            className="mt-2 h-11 rounded-[0.9rem] border-[#d8e5ef] bg-[#f8fcff]"
          />
          {contactPhone && !normalizedContactPhone ? (
            <span className="mt-1 block text-[0.74rem] text-[#d34f4f]">Enter a valid PH mobile number.</span>
          ) : null}
        </label>

        <div className="mt-3 rounded-[1rem] border border-[#d8e8f4] bg-[linear-gradient(180deg,#f8fcff_0%,#eef7ff_100%)] p-3.5">
          <p className="text-sm font-black text-[#2f5878]">Delivery Fee</p>
          <p className="mt-1 text-xs text-[#6d90aa]">Based on distance and estimated travel time.</p>
          <div className="mt-3 grid gap-2 text-[0.84rem] sm:grid-cols-3">
            <span className="rounded-[0.8rem] bg-white px-3 py-2 font-semibold text-[#2f5878]">
              Distance: {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : "Pending"}
            </span>
            <span className="rounded-[0.8rem] bg-white px-3 py-2 font-semibold text-[#2f5878]">
              Est. travel: {etaMin !== null && etaMax !== null ? `${etaMin}-${etaMax} min` : "Pending"}
            </span>
            <span className="rounded-[0.8rem] bg-white px-3 py-2 font-semibold text-[#2f5878]">Fee: {formatCurrency(deliveryFee)}</span>
          </div>
          {isQuoteLoading ? <p className="mt-2 text-xs text-[#7c9fb9]">Updating delivery fee estimate...</p> : null}
          {hasQuoteError ? <p className="mt-2 text-xs text-red-500">{quoteErrorMessage ?? "Unable to calculate delivery fee. Please refine your addresses."}</p> : null}
          {hasQuoteError ? (
            <button
              type="button"
              onClick={() => setQuoteRetryToken((current) => current + 1)}
              className="mt-2 rounded-full border border-[#9fcae8] bg-white px-3 py-1 text-[0.74rem] font-black text-[#1f8fd6]"
            >
              Retry estimate
            </button>
          ) : null}
          {!canRequestQuote && (
            <p className="mt-2 text-xs text-red-500">Select pickup and drop-off suggestions to calculate delivery fee.</p>
          )}
        </div>
      </section>

      <section className="rounded-[1.2rem] border border-[#cfe3f2] bg-white p-4 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7aaed3]">Instructions</p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="block text-xs font-semibold text-text-secondary">
            <textarea
              name="deliveryInstructions"
              rows={1}
              value={deliveryInstructions || riderNotes}
              onChange={(event) => {
                const value = event.target.value;
                event.currentTarget.style.height = "auto";
                event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px`;
                setDeliveryInstructions(value);
                setRiderNotes(value);
              }}
              placeholder="Gate code, landmark, parking, call preference"
              className="mt-2 w-full resize-none overflow-hidden rounded-[1rem] border border-[#cae4f8] bg-[#f9fdff] px-3 py-2 text-sm font-medium text-[#0d4b78] outline-none"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[1.2rem] border border-[#c7d9e8] bg-white p-4 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[0.98rem] font-black text-[#2f5878]">Price breakdown</h2>
          <span className="text-[0.78rem] font-bold text-[#7a98ae]">#{selectedShop.id.slice(0, 6).toUpperCase()}</span>
        </div>
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#edf7ff] px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#1f8fd6]">
          <FlaticonIcon name="badge-check" className="text-[0.72rem]" />
          Price lock at confirmation
        </p>
        <p className="mt-1 text-[0.78rem] font-semibold text-[#6d90aa]">
          {bucketEstimates.length > 0
            ? `${totalLoads} x ${bucketEstimates[0]?.service.name}${bucketEstimates.length > 1 ? ` +${bucketEstimates.length - 1} more` : ""}`
            : "No selected services"}
        </p>

        <div className="mt-3 space-y-1.5 border-t border-[#dbe7f1] pt-2.5 text-[0.84rem]">
          <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
          {optionsTotal > 0 ? <SummaryRow label="Service Fee" value={formatCurrency(optionsTotal)} /> : null}
          <SummaryRow label="Delivery Fee" value={formatCurrency(deliveryFee)} />
          <SummaryRow label="Tip" value={formatCurrency(tipAmount)} />
          {promoDiscount > 0 ? <SummaryRow label="Discount" value={`-${formatCurrency(promoDiscount)}`} /> : null}
          <div className="h-px bg-[#dbe7f1]" />
          <SummaryRow label="Total" value={formatCurrency(total)} strong />
        </div>
      </section>

      <section className="rounded-[1.2rem] border border-[#d5e3ee] bg-white p-4 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
        <div className="mb-3">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7aaed3]">Voucher</p>
          <h2 className="mt-1 text-lg font-black text-[#2c4f74]">Apply voucher</h2>
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={promoCode}
            onChange={(event) => {
              setPromoCode(event.target.value.toUpperCase());
              if (!event.target.value.trim()) {
                setPromoDiscount(0);
                setResolvedPromoCode(null);
                setAppliedPromoCode(null);
                setVoucherStatus("idle");
                setVoucherMessage(null);
              }
            }}
            placeholder="WELCOME100"
            className="h-11 rounded-[0.9rem] border-[#cae4f8] bg-[#f9fdff]"
          />
          <Button
            type="button"
            onClick={() => {
              void handleApplyVoucher();
            }}
            disabled={isApplyingVoucher || promoCode.trim().length === 0}
            className="h-11 rounded-[0.9rem] bg-[#1f8fd6] px-4 text-sm font-bold text-white hover:bg-[#1785c9]"
          >
            {isApplyingVoucher ? "Applying..." : "Apply"}
          </Button>
        </div>

        {voucherMessage ? (
          <p
            className={cn(
              "mt-2 text-xs font-semibold",
              voucherStatus === "applied" && "text-[#1f8fd6]",
              voucherStatus === "invalid" && "text-[#c7572d]",
              voucherStatus === "error" && "text-[#d34f4f]",
            )}
          >
            {voucherMessage}
          </p>
        ) : null}

        {promoDiscount > 0 && resolvedPromoCode ? (
          <button
            type="button"
            onClick={() => {
              setPromoCode("");
              setPromoDiscount(0);
              setResolvedPromoCode(null);
              setAppliedPromoCode(null);
              setVoucherStatus("idle");
              setVoucherMessage(null);
            }}
            className="mt-2 text-xs font-black text-[#2f8ecf] underline"
          >
            Remove applied voucher
          </button>
        ) : null}
      </section>

      <CheckoutPaymentSection
        paymentMethod={paymentMethod}
        normalizedContactPhone={normalizedContactPhone}
        onPaymentMethodChange={setPaymentMethod}
        formatPaymentMethodLabel={formatPaymentMethodLabel}
        formatPaymentMethodHint={formatPaymentMethodHint}
        savedPaymentPreferences={initialPaymentPreferences.map((preference) => ({
          id: preference.id,
          method: preference.method,
          displayLabel: preference.display_label,
          maskedReference: preference.masked_reference,
          isDefault: preference.is_default,
        }))}
      />

      <section className="rounded-[1.2rem] border border-[#d5e3ee] bg-white p-4 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7aaed3]">Tip</p>
            <h2 className="mt-1 text-lg font-black text-[#2c4f74]">Tip your rider</h2>
          </div>
        </div>

        <div id="tip-options-panel" className="space-y-3">
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
                {option === 0 ? "No Tip" : formatCurrency(option)}
              </button>
            ))}
          </div>

          <label className="block text-xs font-semibold text-text-secondary">
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
              <SummaryRow label="Delivery Fee" value={formatCurrency(deliveryFee)} />
              {optionsTotal > 0 ? <SummaryRow label="Service Fee" value={formatCurrency(optionsTotal)} /> : null}
              <SummaryRow label="Tip" value={formatCurrency(tipAmount)} />
              <SummaryRow label="Fees and tax" value="Included" />
              {promoDiscount > 0 ? <SummaryRow label="Discount" value={`-${formatCurrency(promoDiscount)}`} /> : null}
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
      <input type="hidden" name="pickupAddress" value={pickupAddress.trim()} />
      <input type="hidden" name="dropoffAddress" value={dropoffAddress.trim()} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <input type="hidden" name="promoCode" value={resolvedPromoCode ?? ""} />
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
      <input type="hidden" name="deliveryFee" value={deliveryFee ?? 0} />
      <input type="hidden" name="tipAmount" value={tipAmount ?? 0} />
      <input type="hidden" name="deliveryInstructions" value={deliveryInstructions ?? ''} />
      <input type="hidden" name="riderNotes" value={riderNotes ?? ''} />
      <input type="hidden" name="pickupLat" value={pickupLat ?? ""} />
      <input type="hidden" name="pickupLng" value={pickupLng ?? ""} />
      <input type="hidden" name="dropoffLat" value={dropoffLat ?? ""} />
      <input type="hidden" name="dropoffLng" value={dropoffLng ?? ""} />
      <input type="hidden" name="distanceKm" value={distanceKm ?? ""} />
      <input type="hidden" name="etaMinutes" value={etaMax ?? ""} />

      <CheckoutSubmitButton
        disabled={!isCheckoutReady}
        isSubmitting={isSubmitting}
        total={total}
        onSeeSummary={() => setIsSummaryOpen(true)}
      />
    </form>
  );
}

function CheckoutSubmitButton({
  disabled,
  isSubmitting,
  total,
  onSeeSummary,
}: {
  disabled: boolean;
  isSubmitting: boolean;
  total: number;
  onSeeSummary: () => void;
}) {
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
          disabled={disabled || isSubmitting}
        >
          {isSubmitting ? "Booking..." : "Confirm Booking"}
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

function haversineDistanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const deltaLat = toRad(to.lat - from.lat);
  const deltaLng = toRad(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function clampWeight(value: number) {
  return Number(Math.min(250, Math.max(0, value)).toFixed(1));
}

function formatCurrency(value: number | null | undefined) {
  const safeValue = typeof value === "number" && isFinite(value) ? value : 0;
  return `₱${safeValue.toFixed(2)}`;
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
const HIGH_DEMAND_SLOTS = new Set(["11:00", "12:00", "17:00", "18:00"]);
const LIMITED_SLOTS = new Set(["08:00", "16:00"]);

function ScheduleCalendarPanel({
  value,
  minimumDateTime,
  onChange,
}: {
  value: string;
  minimumDateTime: string;
  onChange: (value: string) => void;
}) {
  const parsedSelectedDate = parseInputDate(value) ?? startOfDay(new Date());
  const [displayMonth, setDisplayMonth] = useState(
    () => startOfDay(new Date(parsedSelectedDate.getFullYear(), parsedSelectedDate.getMonth(), 1)),
  );
  const minDate = startOfDay(new Date(minimumDateTime));

  const monthLabel = displayMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const monthStart = startOfDay(new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1));
  const mondayIndex = (monthStart.getDay() + 6) % 7;
  const gridStart = addDays(monthStart, -mondayIndex);
  const dayCells = Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    const key = toInputDate(date);
    const isCurrentMonth = date.getMonth() === displayMonth.getMonth();
    const isSelected = key === value;
    const isDisabled = date.getTime() < minDate.getTime();

    return {
      key,
      date,
      label: date.getDate(),
      isCurrentMonth,
      isSelected,
      isDisabled,
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3 pb-2">
        <button
          type="button"
          onClick={() => setDisplayMonth((current) => startOfDay(new Date(current.getFullYear(), current.getMonth() - 1, 1)))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#2f8ecf] hover:bg-[#edf7ff]"
          aria-label="Previous month"
        >
          <FlaticonIcon name="angle-small-left" className="text-lg" />
        </button>
        <p className="text-base font-black text-[#2c4f74]">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setDisplayMonth((current) => startOfDay(new Date(current.getFullYear(), current.getMonth() + 1, 1)))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#2f8ecf] hover:bg-[#edf7ff]"
          aria-label="Next month"
        >
          <FlaticonIcon name="angle-small-right" className="text-lg" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[0.78rem] font-bold text-[#6d90aa]">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="space-y-1">
        {Array.from({ length: 6 }, (_, week) => {
          const weekCells = dayCells.slice(week * 7, week * 7 + 7);
          return (
            <div key={`week-${week}`} className="grid grid-cols-7 gap-1 rounded-full bg-[#edf7ff] px-1 py-1">
              {weekCells.map((cell) => (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => {
                    if (cell.isDisabled) return;
                    onChange(cell.key);
                  }}
                  disabled={cell.isDisabled}
                  className={cn(
                    "mx-auto inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition",
                    cell.isSelected && "bg-[#2f8ecf] text-white",
                    !cell.isSelected && cell.isCurrentMonth && "text-[#2f5878] hover:bg-white",
                    !cell.isSelected && !cell.isCurrentMonth && "text-[#9ca3af]",
                    cell.isDisabled && "cursor-not-allowed text-[#d1d5db] hover:bg-transparent",
                  )}
                >
                  {cell.label}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleTimePanel({
  dateValue,
  value,
  minimumDateTime,
  onChange,
}: {
  dateValue: string;
  value: string;
  minimumDateTime: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {TIME_SLOTS.map((slot) => {
        const isActive = slot === value;
        const isDisabled = isSlotUnavailable(dateValue, slot, minimumDateTime);
        const demandLabel = getDemandLabel(slot);

        return (
          <button
            key={slot}
            type="button"
            onClick={() => {
              if (isDisabled) return;
              onChange(slot);
            }}
            disabled={isDisabled}
            className={cn(
              "rounded-[0.85rem] border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8ecf]",
              isDisabled && "cursor-not-allowed border-[#e2e8f0] bg-[#f8fafc] text-[#94a3b8]",
              !isDisabled && isActive && "border-[#2f8ecf] bg-[#2f8ecf] text-white",
              !isDisabled && !isActive && "border-[#c7d9e8] bg-white text-[#2f5878] hover:border-[#9fcae8]",
            )}
          >
            <p className="text-[0.76rem] font-black">{formatSlotTime(slot)}</p>
            {!isDisabled && demandLabel ? <p className="text-[0.64rem] font-semibold opacity-90">{demandLabel}</p> : null}
            {isDisabled ? <p className="text-[0.64rem] font-semibold">Unavailable</p> : null}
          </button>
        );
      })}
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

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInputDate(value: string) {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return startOfDay(parsed);
}

function formatScheduleDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not set";
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isSlotUnavailable(dateValue: string, slot: string, minimumDateTime: string) {
  const selectedTime = Date.parse(composeDateTime(dateValue, slot));
  const minTime = Date.parse(minimumDateTime);

  if (Number.isNaN(selectedTime)) {
    return true;
  }

  if (Number.isNaN(minTime)) {
    return false;
  }

  return selectedTime < minTime;
}

function getDemandLabel(slot: string) {
  if (HIGH_DEMAND_SLOTS.has(slot)) {
    return "High demand";
  }

  if (LIMITED_SLOTS.has(slot)) {
    return "Limited";
  }

  return null;
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
  useSameDropoff?: boolean;
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
      useSameDropoff?: boolean;
    };
  } catch {
    return null;
  }
}

