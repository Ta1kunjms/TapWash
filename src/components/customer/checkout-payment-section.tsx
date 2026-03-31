"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type PaymentMethod = "cod" | "gcash" | "card";

type PaymentPreference = {
  id: string;
  method: PaymentMethod;
  displayLabel: string | null;
  maskedReference: string | null;
  isDefault: boolean;
};

const PAYMENT_METHOD_OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
  badge: string;
  description: string;
}> = [
  {
    value: "cod",
    label: "Cash on Delivery",
    badge: "COD",
    description: "Pay in cash when your rider arrives.",
  },
  {
    value: "gcash",
    label: "GCash",
    badge: "GC",
    description: "Pay using your mobile wallet number.",
  },
  {
    value: "card",
    label: "Card",
    badge: "CRD",
    description: "Pay securely with your debit or credit card.",
  },
];

type Props = {
  paymentMethod: PaymentMethod;
  normalizedContactPhone: string | null;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  formatPaymentMethodLabel: (method: PaymentMethod) => string;
  formatPaymentMethodHint: (method: PaymentMethod, normalizedContactPhone: string | null) => string;
  savedPaymentPreferences: PaymentPreference[];
};

export function CheckoutPaymentSection({
  paymentMethod,
  normalizedContactPhone,
  onPaymentMethodChange,
  formatPaymentMethodLabel,
  formatPaymentMethodHint,
  savedPaymentPreferences,
}: Props) {
  const [selectedSavedPreferenceId, setSelectedSavedPreferenceId] = useState<string | null>(null);
  const displayedSavedPreferences = useMemo(() => savedPaymentPreferences.slice(0, 3), [savedPaymentPreferences]);
  const hasSavedPreferences = displayedSavedPreferences.length > 0;

  const activeSavedPreferenceId = useMemo(() => {
    if (selectedSavedPreferenceId && displayedSavedPreferences.some((item) => item.id === selectedSavedPreferenceId)) {
      return selectedSavedPreferenceId;
    }

    const defaultPreference = displayedSavedPreferences.find((item) => item.isDefault && item.method === paymentMethod);
    if (defaultPreference) {
      return defaultPreference.id;
    }

    const firstMatchingMethod = displayedSavedPreferences.find((item) => item.method === paymentMethod);
    return firstMatchingMethod?.id ?? null;
  }, [displayedSavedPreferences, paymentMethod, selectedSavedPreferenceId]);

  const renderSavedBadge = (method: PaymentMethod) => {
    if (method === "card") {
      return (
        <span className="relative inline-flex h-7 w-10 items-center justify-center">
          <span className="absolute left-1.5 h-4 w-4 rounded-full bg-[#f15a5a] opacity-90" />
          <span className="absolute right-1.5 h-4 w-4 rounded-full bg-[#f5b740] opacity-90" />
        </span>
      );
    }

    if (method === "gcash") {
      return (
        <span className="inline-flex h-7 w-10 items-center justify-center rounded-full bg-[#eaf2ff] text-[0.66rem] font-black text-[#2f8ecf]">
          PP
        </span>
      );
    }

    return (
      <span className="inline-flex h-7 w-10 items-center justify-center rounded-full bg-[#f2f6fa] text-[0.64rem] font-black text-[#5f7891]">
        COD
      </span>
    );
  };

  return (
    <section className="rounded-[1.2rem] border border-[#d5e3ee] bg-white p-4 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
      <div className="mb-3">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7aaed3]">Payment</p>
        <h2 className="mt-1 text-lg font-black text-[#2c4f74]">Select payment method</h2>
        <p className="mt-1 text-[0.78rem] font-semibold text-[#6d90aa]">Choose how you want to pay for this order.</p>
      </div>

      {hasSavedPreferences ? (
        <div className="rounded-[1rem] border border-[#d8e5ef] bg-white p-2.5" role="radiogroup" aria-label="Saved payment methods">
          <div className="mb-2 flex items-center justify-end">
            <Link
              href="/customer/settings/payment"
              className="text-[0.72rem] font-black text-[#2f8ecf] underline-offset-2 hover:underline"
            >
              See all
            </Link>
          </div>

          <div className="overflow-hidden rounded-[0.75rem]">
            {displayedSavedPreferences.map((preference, index) => {
              const isSelected = activeSavedPreferenceId === preference.id;
              const label = preference.displayLabel?.trim() || formatPaymentMethodLabel(preference.method);

              return (
                <div key={preference.id} className={index > 0 ? "border-t border-[#e3edf4]" : ""}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setSelectedSavedPreferenceId(preference.id);
                      onPaymentMethodChange(preference.method);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-2.5 py-2.5 pr-4 text-left transition",
                      isSelected ? "bg-[#edf7ff]" : "bg-white hover:bg-[#f8fbfe]",
                    )}
                  >
                    {renderSavedBadge(preference.method)}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.82rem] font-black text-[#2f5878]">{label}</span>
                    </span>
                    <span
                      className={cn(
                        "mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                        isSelected ? "border-[#2f8ecf] bg-[#2f8ecf]" : "border-[#bfd3e3] bg-white",
                      )}
                    >
                      {isSelected ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-2">
            <Link
              href="/customer/settings/payment"
              className="inline-flex w-full items-center justify-center rounded-full border border-[#dbe8f2] bg-[#f6fafc] px-3 py-2 text-[0.78rem] font-black text-[#4f6f88] transition hover:border-[#bdd3e4]"
            >
              + Add Payment Method
            </Link>
          </div>
        </div>
      ) : null}

      {!hasSavedPreferences ? (
        <fieldset>
          <legend className="sr-only">Payment method</legend>
          <div className="overflow-hidden rounded-[0.95rem] border border-[#d8e5ef]" role="radiogroup" aria-label="Payment method">
            {PAYMENT_METHOD_OPTIONS.map((option, index) => {
              const isSelected = paymentMethod === option.value;

              return (
                <label key={option.value} className={cn("block", index > 0 ? "border-t border-[#e3edf4]" : "")}>
                  <input
                    type="radio"
                    name="paymentMethodSelection"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => onPaymentMethodChange(option.value)}
                    className="sr-only"
                  />

                  <span
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-2.5 py-2.5 pr-4 text-left transition",
                      isSelected ? "bg-[#edf7ff]" : "bg-white hover:bg-[#f8fbfe]",
                    )}
                  >
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-[0.64rem] font-black text-[#2f5878]">
                      {option.badge}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.82rem] font-black text-[#2f5878]">{option.label}</span>
                    </span>
                    <span
                      className={cn(
                        "mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                        isSelected ? "border-[#2f8ecf] bg-[#2f8ecf]" : "border-[#bfd3e3] bg-white",
                      )}
                    >
                      {isSelected ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {!hasSavedPreferences ? (
        <div className="mt-2 rounded-[0.8rem] border border-[#d9e9f5] bg-[#f7fbff] px-3 py-2">
          <p className="text-[0.74rem] font-semibold text-[#557a99]">
            <span className="font-black text-[#2f5878]">{formatPaymentMethodLabel(paymentMethod)}: </span>
            {formatPaymentMethodHint(paymentMethod, normalizedContactPhone)}
          </p>
        </div>
      ) : null}
    </section>
  );
}
