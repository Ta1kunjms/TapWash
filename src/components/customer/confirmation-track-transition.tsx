"use client";

import { cancelOrderDuringConfirmationAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TransitionState = "idle" | "confirming_countdown" | "confirming_locked" | "redirecting";

type ConfirmationTrackTransitionProps = {
  orderId: string;
  shopName: string;
  checkoutHref: string;
  trackHref: string;
  canCancel: boolean;
};

const COUNTDOWN_START = 5;
const AUTO_REDIRECT_DELAY_MS = 750;

export function ConfirmationTrackTransition({
  orderId,
  shopName,
  checkoutHref,
  trackHref,
  canCancel,
}: ConfirmationTrackTransitionProps) {
  const router = useRouter();
  const trackButtonRef = useRef<HTMLButtonElement | null>(null);
  const [state, setState] = useState<TransitionState>("confirming_countdown");
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_START);
  const [isCancelling, setIsCancelling] = useState(false);

  const cancellationAllowed = canCancel && state === "confirming_countdown" && secondsLeft > 0;
  const isCancelDisabled = !cancellationAllowed || isCancelling;

  const cancelLabel = useMemo(() => {
    if (state === "confirming_countdown" && secondsLeft > 0) {
      return `Cancel Request ${secondsLeft}`;
    }

    return "Cancel Request";
  }, [secondsLeft, state]);

  const navigateToTracking = useCallback(() => {
    try {
      router.push(trackHref);
    } catch {
      notify.error("Unable to open tracking right now.");
      setState("confirming_locked");
    }
  }, [router, trackHref]);

  const handleCancelRequest = useCallback(async () => {
    if (!cancellationAllowed || isCancelling) {
      return;
    }

    setIsCancelling(true);

    const result = await cancelOrderDuringConfirmationAction(orderId);

    if (!result.ok) {
      notify.error(result.message);
      setIsCancelling(false);
      return;
    }

    router.replace(checkoutHref);
  }, [cancellationAllowed, checkoutHref, isCancelling, orderId, router]);

  useEffect(() => {
    if (state !== "confirming_countdown") {
      return;
    }

    if (secondsLeft <= 0) {
      const lockTimeout = window.setTimeout(() => {
        setState("confirming_locked");
      }, 0);

      return () => {
        window.clearTimeout(lockTimeout);
      };
    }

    // Keep countdown lifecycle deterministic and cleaned up on state changes/unmount.
    const tickTimeout = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearTimeout(tickTimeout);
    };
  }, [secondsLeft, state]);

  useEffect(() => {
    if (state !== "confirming_locked") {
      return;
    }

    const redirectTimeout = window.setTimeout(() => {
      setState("redirecting");
      navigateToTracking();
    }, AUTO_REDIRECT_DELAY_MS);

    return () => {
      window.clearTimeout(redirectTimeout);
    };
  }, [navigateToTracking, state]);

  useEffect(() => {
    if (state === "confirming_countdown" || state === "confirming_locked") {
      trackButtonRef.current?.focus();
    }
  }, [state]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (!cancellationAllowed || isCancelling) {
        return;
      }

      event.preventDefault();
      void handleCancelRequest();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [cancellationAllowed, handleCancelRequest, isCancelling]);

  function handleTrackLaundry() {
    setState("redirecting");
    navigateToTracking();
  }

  return (
    <main className="relative min-h-[82vh] overflow-hidden rounded-[1.6rem] border border-[#b9d4e8] bg-[#dceeff]">
      <section className="absolute inset-0 bg-[linear-gradient(180deg,rgba(181,214,239,0.7)_0%,rgba(158,201,233,0.82)_100%)]" aria-hidden="true" />

      <section
        className="absolute inset-0 opacity-50"
        aria-label="Map background"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.42) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.42) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-4 py-3 text-[#2f5878]">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-[#2f8ecf]"
          aria-label="Back"
        >
          <FlaticonIcon name="angle-small-left" className="text-xl" />
        </button>
        <div className="text-center">
          <p className="text-sm font-black">Track Laundry</p>
          <p className="text-xs font-semibold text-[#3f78a0]">{shopName}</p>
        </div>
        <span className="h-9 w-9" aria-hidden="true" />
      </header>

      <section className="absolute inset-0 z-20 flex items-center justify-center bg-[#10263d]/44 p-4">
        <article
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-confirmed-title"
          aria-describedby="request-confirmed-message"
          className="w-full max-w-[21rem] rounded-[1rem] bg-white p-5 text-center shadow-[0_24px_60px_rgba(7,35,58,0.35)] transition-all duration-300 ease-out"
        >
          <div className="mx-auto -mt-14 mb-3 inline-flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#5ab947] bg-white text-[#1597dc] shadow-[0_8px_20px_rgba(11,77,121,0.2)]">
            <FlaticonIcon name="shipping-fast" className="text-[2rem]" />
          </div>

          <h1 id="request-confirmed-title" className="text-[1.2rem] font-black uppercase tracking-[0.03em] text-[#1489cd]">
            REQUEST HAS BEEN CONFIRMED!
          </h1>
          <p id="request-confirmed-message" className="mt-3 text-sm font-semibold text-[#72afd4]">
            Your TapWash rider is on the way!
          </p>

          <div className="mt-5 space-y-2.5">
            <button
              ref={trackButtonRef}
              type="button"
              onClick={handleTrackLaundry}
              disabled={state === "redirecting"}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#3fa9ea] text-sm font-bold text-white transition hover:bg-[#2f99dc] disabled:cursor-not-allowed disabled:opacity-80"
            >
              {state === "redirecting" ? "Opening tracking..." : "Track Laundry"}
            </button>

            <Button
              type="button"
              onClick={() => {
                void handleCancelRequest();
              }}
              disabled={isCancelDisabled}
              className={cn(
                "h-11 w-full rounded-full text-sm font-bold text-white transition",
                isCancelDisabled ? "bg-[#d2d7dc] text-white/90" : "bg-[#f45a5a] hover:bg-[#ea4747]",
              )}
            >
              {isCancelling ? "Cancelling..." : cancelLabel}
            </Button>
          </div>
        </article>
      </section>
    </main>
  );
}
