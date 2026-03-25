"use client";

import { cn } from "@/lib/utils";

type PaymentMethod = "cod" | "gcash" | "card";

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
};

export function CheckoutPaymentSection({
  paymentMethod,
  normalizedContactPhone,
  onPaymentMethodChange,
  formatPaymentMethodLabel,
  formatPaymentMethodHint,
}: Props) {
  return (
    <section className="rounded-[1.2rem] border border-[#d5e3ee] bg-white p-4 shadow-[0_8px_18px_rgba(92,128,160,0.12)]">
      <div className="mb-3">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7aaed3]">Payment</p>
        <h2 className="mt-1 text-lg font-black text-[#2c4f74]">Select payment method</h2>
        <p className="mt-1 text-[0.78rem] font-semibold text-[#6d90aa]">Choose how you want to pay for this order.</p>
      </div>

      <fieldset>
        <legend className="sr-only">Payment method</legend>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Payment method">
          {PAYMENT_METHOD_OPTIONS.map((option) => {
            const isSelected = paymentMethod === option.value;

            return (
              <label
                key={option.value}
                className={cn(
                  "cursor-pointer rounded-[0.9rem] border px-3 py-3 transition focus-within:ring-2 focus-within:ring-[#2f8ecf]",
                  isSelected
                    ? "border-[#2f8ecf] bg-[#edf7ff] shadow-[0_4px_14px_rgba(47,142,207,0.2)]"
                    : "border-[#d8e5ef] bg-[#f9fcff]",
                )}
              >
                <input
                  type="radio"
                  name="paymentMethodSelection"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => onPaymentMethodChange(option.value)}
                  className="sr-only"
                />

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full",
                      isSelected ? "bg-[#2f8ecf] text-white" : "bg-white text-[#2f8ecf]",
                    )}
                  >
                    <span className="text-[0.64rem] font-black">{option.badge}</span>
                  </span>
                  <span className="text-[0.82rem] font-black text-[#2f5878]">{option.label}</span>
                </div>

                <p className="mt-1 text-[0.72rem] font-semibold text-[#6d90aa]">{option.description}</p>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-2 rounded-[0.8rem] border border-[#d9e9f5] bg-[#f7fbff] px-3 py-2">
        <p className="text-[0.74rem] font-semibold text-[#557a99]">
          <span className="font-black text-[#2f5878]">{formatPaymentMethodLabel(paymentMethod)}: </span>
          {formatPaymentMethodHint(paymentMethod, normalizedContactPhone)}
        </p>
      </div>
    </section>
  );
}
