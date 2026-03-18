export type LocationPermissionStatus = "granted" | "denied" | "unsupported";

export const LOCATION_PERMISSION_STATUS_KEY = "tapwash.locationPermissionStatus";
export const LOCATION_PERMISSION_PROMPTED_AT_KEY = "tapwash.locationPermissionPromptedAt";
export const LOCATION_ONBOARDING_PATH = "/customer/onboarding/location";
export const LOCATION_DENIED_REPROMPT_MS = 14 * 24 * 60 * 60 * 1000;

export function isLocationPermissionStatus(value: string | null): value is LocationPermissionStatus {
  return value === "granted" || value === "denied" || value === "unsupported";
}

export function canRepromptDenied(lastPromptedAt: string | null): boolean {
  if (!lastPromptedAt) return true;
  const parsed = Date.parse(lastPromptedAt);
  if (Number.isNaN(parsed)) return true;
  return Date.now() - parsed >= LOCATION_DENIED_REPROMPT_MS;
}
