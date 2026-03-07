import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type StepIndex = 1 | 2 | 3;

type OrderStepperProps = {
  currentStep: StepIndex;
};

const steps = [
  { key: 1 as StepIndex, label: "Booking" },
  { key: 2 as StepIndex, label: "Checkout" },
  { key: 3 as StepIndex, label: "Done" },
];

export function OrderStepper({ currentStep }: OrderStepperProps) {
  const currentIndex = steps.findIndex((step) => step.key === currentStep);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex items-end justify-center w-full">
        <div className="flex items-end w-full max-w-[480px] justify-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center justify-center">
                <span
                  className={cn(
                    "mb-1 text-[0.9rem] font-bold leading-none",
                    currentStep === step.key ? "text-[#2196f3]" : "text-[#b4bdc5]",
                  )}
                >
                  {step.label}
                </span>
                <StepPill
                  label={String(step.key)}
                  state={getStepState(step.key, currentStep)}
                  href={undefined}
                />
              </div>
              {index < steps.length - 1 ? (
                <span
                  key={"line-" + step.key}
                  className={cn(
                    "h-[3px] w-[96px] mx-2 align-middle self-center rounded-full transition-colors",
                    index < currentIndex ? "bg-[#2196f3]" : "bg-[#d7dde2]",
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function getStepState(step: StepIndex, currentStep: StepIndex): "done" | "current" | "upcoming" {
  if (step < currentStep) return "done";
  if (step === currentStep) return "current";
  return "upcoming";
}

function StepPill({
  label,
  state,
  href,
}: {
  label: string;
  state: "done" | "current" | "upcoming";
  href?: string;
}) {
  const className = cn(
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition",
    state === "current" && "border-[#2196f3] bg-[#2196f3] text-white shadow-[0_0_0_3px_rgba(33,150,243,0.22)]",
    state === "done" && "border-[#2196f3] bg-[#2196f3] text-white",
    state === "upcoming" && "border-[#d7dde2] bg-[#eceff2] text-[#9da8b1]",
  );

  if (href) {
    return (
      <Link href={href} className={cn(className, "hover:bg-primary-500/25")} aria-label="Go back to menu step">
        {label}
      </Link>
    );
  }

  return <span className={className}>{label}</span>;
}
