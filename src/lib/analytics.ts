type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("tapwash:analytics", {
      detail: {
        eventName,
        payload,
        timestamp: Date.now(),
      },
    }),
  );

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", eventName, payload);
  }
}
