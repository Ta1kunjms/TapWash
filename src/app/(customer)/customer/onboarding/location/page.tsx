"use client";

import { Button } from "@/components/ui/button";
import {
  LOCATION_PERMISSION_PROMPTED_AT_KEY,
  LOCATION_PERMISSION_STATUS_KEY,
  isLocationPermissionStatus,
  type LocationPermissionStatus,
} from "@/lib/location-permission";
import { notify } from "@/lib/notify";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

function buildNextPath(rawValue: string | null): string {
  if (!rawValue) return "/customer";
  if (!rawValue.startsWith("/customer")) return "/customer";
  return rawValue;
}

function setStoredStatus(value: LocationPermissionStatus) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCATION_PERMISSION_STATUS_KEY, value);
}

function setPromptedAt(value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCATION_PERMISSION_PROMPTED_AT_KEY, value);
}

async function persistPermissionToProfile(value: LocationPermissionStatus): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("profiles")
    .update({
      location_permission_status: value,
      location_permission_updated_at: new Date().toISOString(),
      location_onboarding_last_prompted_at: new Date().toISOString(),
    })
    .eq("id", user.id);
}

function LocationOnboardingIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[18rem] pt-2">
      <div className="absolute -left-8 top-8 h-20 w-20 rounded-full bg-primary-500/15 blur-xl" aria-hidden />
      <div className="absolute -right-8 top-4 h-24 w-24 rounded-full bg-sky-200/60 blur-xl" aria-hidden />

      <svg viewBox="0 0 320 220" className="relative h-auto w-full" role="img" aria-label="Laundry and map illustration">
        <defs>
          <linearGradient id="map-fill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#e4f3ff" />
            <stop offset="100%" stopColor="#c5e6ff" />
          </linearGradient>
          <linearGradient id="washer-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2f9bec" />
            <stop offset="100%" stopColor="#1e88e5" />
          </linearGradient>
        </defs>

        <path
          d="M34 165L84 102L170 126L246 76L289 140L205 187L123 163L65 192Z"
          fill="url(#map-fill)"
          stroke="#9dd2f9"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M84 102L124 163" stroke="#9dd2f9" strokeWidth="3" strokeLinecap="round" />
        <path d="M170 126L205 187" stroke="#9dd2f9" strokeWidth="3" strokeLinecap="round" />

        <rect x="106" y="44" width="114" height="126" rx="20" fill="url(#washer-fill)" />
        <rect x="118" y="58" width="90" height="24" rx="12" fill="#8fd0ff" />
        <circle cx="163" cy="116" r="34" fill="#e8f6ff" />
        <circle cx="163" cy="116" r="23" fill="#9bd4fb" />

        <path d="M255 30C239 30 227 42 227 58C227 80 255 108 255 108C255 108 283 80 283 58C283 42 271 30 255 30Z" fill="#1e88e5" />
        <circle cx="255" cy="58" r="9" fill="#d9f0ff" />

        <circle cx="89" cy="146" r="10" fill="#1e88e5" />
        <circle cx="89" cy="146" r="4" fill="#d9f0ff" />
      </svg>
    </div>
  );
}

export default function LocationOnboardingPage() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);
  const [nextPath] = useState(() => {
    if (typeof window === "undefined") return "/customer";
    const params = new URLSearchParams(window.location.search);
    return buildNextPath(params.get("next"));
  });

  const continueToApp = () => {
    router.replace(nextPath);
  };

  const persistAndContinue = async (status: LocationPermissionStatus) => {
    const now = new Date().toISOString();
    setStoredStatus(status);
    setPromptedAt(now);
    try {
      await persistPermissionToProfile(status);
    } catch {
      // Keep flow resilient if profile sync fails.
    }
    continueToApp();
  };

  const hydrateLegacyStoredState = () => {
    const legacy = window.localStorage.getItem("tapwash.locationOnboardingStatus");
    if (isLocationPermissionStatus(legacy)) {
      setStoredStatus(legacy);
      return legacy;
    }
    return null;
  };

  const handleContinue = () => {
    if (isRequesting) return;

    hydrateLegacyStoredState();

    if (!("geolocation" in navigator)) {
      void persistAndContinue("unsupported");
      notify.warning("Location is not supported on this device. You can still continue.");
      return;
    }

    setIsRequesting(true);

    navigator.geolocation.getCurrentPosition(
      () => {
        void persistAndContinue("granted");
        notify.success("Location access enabled.");
      },
      () => {
        void persistAndContinue("denied");
        notify.info("Location access was skipped. You can enable it later in settings.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(120%_120%_at_0%_0%,_#f3faff_0%,_#d9ecff_45%,_#c4e4ff_100%)] px-5 pt-8 pb-36">
      <div className="mx-auto w-full max-w-md">
        <LocationOnboardingIllustration />

        <section className="mt-6 rounded-3xl border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur">
          <h1 className="text-2xl font-black leading-tight text-text-primary">
            Allow location access to get the best laundry experience
          </h1>
          <p className="mt-2 text-sm text-text-secondary/80">
            We only use your location to personalize nearby laundry options and improve pickup and delivery accuracy.
          </p>

          <ul className="mt-5 space-y-3">
            <li className="flex items-start gap-3 rounded-2xl bg-background-app/75 p-3">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/15 text-primary-500" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <p className="text-sm font-semibold text-text-secondary">Find the best laundry shops near you</p>
            </li>
            <li className="flex items-start gap-3 rounded-2xl bg-background-app/75 p-3">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/15 text-primary-500" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 16.5h13" />
                  <path d="M3 12h9" />
                  <path d="M3 7.5h6" />
                  <circle cx="18" cy="16.5" r="3" />
                </svg>
              </span>
              <p className="text-sm font-semibold text-text-secondary">Faster and more accurate pickup and delivery</p>
            </li>
          </ul>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="mx-auto w-full max-w-md bg-gradient-to-b from-[#eaf5ff] to-[#d6eafd] px-4 pb-3 pt-4 shadow-[0_-8px_32px_0_rgba(33,126,191,0.18),0_-1.5px_0_0_#c7d9e8]">
          <Button
            type="button"
            onClick={handleContinue}
            disabled={isRequesting}
            className="h-12 w-full rounded-full bg-[#43a9eb] text-[1.2rem] font-bold leading-none text-white shadow-[0_12px_26px_rgba(33,126,191,0.35)] hover:bg-[#389fdf]"
            aria-label="Continue and allow location access"
          >
            {isRequesting ? "Requesting permission..." : "Continue"}
          </Button>
        </div>
      </div>
    </main>
  );
}
