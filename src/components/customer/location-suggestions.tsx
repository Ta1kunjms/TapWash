"use client";
import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";

export function LocationSuggestions() {
  const [recent, setRecent] = useState<string[]>([]);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoAddress, setGeoAddress] = useState<string>("");
  const [loadingGeo, setLoadingGeo] = useState(false);
  // Load recent addresses from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("tapwash.savedAddresses");
      const arr = raw ? (JSON.parse(raw) as unknown) : [];
      setRecent(Array.isArray(arr) ? arr.filter((v): v is string => typeof v === "string") : []);
    } catch {}
  }, []);

  // Get current geolocation
  const getGeo = () => {
    if (!navigator.geolocation) {
      notify.error("Geolocation is not supported on this device.");
      return;
    }
    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        // Reverse geocode
        try {
          const resp = await fetch(`/api/maps/reverse?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
          if (!resp.ok) throw new Error();
          const body = await resp.json();
          setGeoAddress(body.address || "Current Location");
        } catch {
          setGeoAddress("Current Location");
        }
        setLoadingGeo(false);
      },
      () => {
        notify.error("Unable to access your current location.");
        setLoadingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  // Helper to set address in LocationPicker
  const setPickerAddress = (address: string, coords?: { lat: number; lng: number }) => {
    // Find the input in LocationPicker and set value
    const input = document.querySelector('input[name="address"]') as HTMLInputElement | null;
    if (input) {
      input.value = address;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (coords) {
      const latInput = document.querySelector('input[name="lat"]') as HTMLInputElement | null;
      const lngInput = document.querySelector('input[name="lng"]') as HTMLInputElement | null;
      if (latInput && lngInput) {
        latInput.value = coords.lat.toString();
        lngInput.value = coords.lng.toString();
        latInput.dispatchEvent(new Event("input", { bubbles: true }));
        lngInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  };

  return (
    <section className="mt-6 space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={getGeo}
          className="rounded-lg border border-border-muted px-3 py-2 text-sm font-semibold text-primary-500 flex items-center gap-1"
          disabled={loadingGeo}
        >
          📍 {loadingGeo ? "Getting current location..." : "Use my current location"}
        </button>
        {geoAddress && (
          <button
            type="button"
            className="ml-2 rounded-lg bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-600"
            onClick={() => setPickerAddress(geoAddress, geo || undefined)}
          >
            Set: {geoAddress}
          </button>
        )}
      </div>
      {recent.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold text-text-secondary">Recent Locations</div>
          <div className="flex flex-wrap gap-2">
            {recent.map((addr) => (
              <button
                key={addr}
                type="button"
                className="rounded-lg border border-border-muted bg-background-app px-3 py-1 text-xs font-medium text-text-primary hover:bg-primary-50"
                onClick={() => setPickerAddress(addr)}
              >
                {addr}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
