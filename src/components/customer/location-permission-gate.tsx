"use client";

import {
  LOCATION_ONBOARDING_PATH,
  LOCATION_PERMISSION_PROMPTED_AT_KEY,
  LOCATION_PERMISSION_STATUS_KEY,
  canRepromptDenied,
  isLocationPermissionStatus,
  type LocationPermissionStatus,
} from "@/lib/location-permission";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function getStoredStatus(): LocationPermissionStatus | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(LOCATION_PERMISSION_STATUS_KEY)
    ?? window.localStorage.getItem("tapwash.locationOnboardingStatus");
  return isLocationPermissionStatus(value) ? value : null;
}

function setStoredStatus(value: LocationPermissionStatus): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCATION_PERMISSION_STATUS_KEY, value);
}

function getStoredPromptedAt(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LOCATION_PERMISSION_PROMPTED_AT_KEY);
}

function setStoredPromptedAt(value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCATION_PERMISSION_PROMPTED_AT_KEY, value);
}

export function CustomerLocationPermissionGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname.startsWith("/customer") || pathname.startsWith(LOCATION_ONBOARDING_PATH)) return;

    let cancelled = false;

    const enforceGate = async () => {
      if (!("geolocation" in navigator)) {
        setStoredStatus("unsupported");
        return;
      }

      const search = typeof window !== "undefined" ? window.location.search : "";
      const nextPath = `${pathname}${search}`;
      const onboardingPath = `${LOCATION_ONBOARDING_PATH}?next=${encodeURIComponent(nextPath)}`;

      const shouldRedirect = async () => {
        const nowIso = new Date().toISOString();
        setStoredPromptedAt(nowIso);

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase
            .from("profiles")
            .update({ location_onboarding_last_prompted_at: nowIso })
            .eq("id", user.id);
        }

        if (!cancelled) {
          router.replace(onboardingPath);
        }
      };

      const localStatus = getStoredStatus();
      if (localStatus === "granted" || localStatus === "unsupported") return;
      if (localStatus === "denied" && !canRepromptDenied(getStoredPromptedAt())) return;

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("location_permission_status, location_onboarding_last_prompted_at")
        .eq("id", user.id)
        .single<{
          location_permission_status: string | null;
          location_onboarding_last_prompted_at: string | null;
        }>();

      if (cancelled) return;

      const remoteStatus = isLocationPermissionStatus(profile?.location_permission_status ?? null)
        ? (profile?.location_permission_status as LocationPermissionStatus)
        : null;
      const remotePromptedAt = profile?.location_onboarding_last_prompted_at ?? null;

      if (remoteStatus === "granted" || remoteStatus === "unsupported") {
        setStoredStatus(remoteStatus);
        return;
      }

      if (remoteStatus === "denied") {
        setStoredStatus("denied");
        if (!getStoredPromptedAt() && remotePromptedAt) {
          setStoredPromptedAt(remotePromptedAt);
        }
        if (!canRepromptDenied(getStoredPromptedAt() ?? remotePromptedAt)) {
          return;
        }
      }

      if ("permissions" in navigator && typeof navigator.permissions.query === "function") {
        try {
          const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
          if (permissionStatus.state === "granted") {
            setStoredStatus("granted");
            await supabase
              .from("profiles")
              .update({
                location_permission_status: "granted",
                location_permission_updated_at: new Date().toISOString(),
              })
              .eq("id", user.id);
            return;
          }
        } catch {
          // Fall through to onboarding redirect if browser permission API check fails.
        }
      }

      await shouldRedirect();
    };

    void enforceGate();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
