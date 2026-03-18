"use client";

import { AddressAutocomplete } from "@/components/customer/address-autocomplete";
import { notify } from "@/lib/notify";
import type { MouseEvent } from "react";
import { useState } from "react";

type Coordinates = { lat: number; lng: number };

type Props = {
  initialAddress: string;
};

const SAVED_ADDRESSES_KEY = "tapwash.savedAddresses";

const MAP_BOUNDS = {
  minLat: 6.02,
  maxLat: 6.19,
  minLng: 125.05,
  maxLng: 125.24,
};

function toLatLng(relativeX: number, relativeY: number): Coordinates {
  const lat = MAP_BOUNDS.maxLat - relativeY * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);
  const lng = MAP_BOUNDS.minLng + relativeX * (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
  return { lat, lng };
}

export function LocationPicker({ initialAddress }: Props) {
  const [mode, setMode] = useState<"input" | "map">("input");
  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const resolveAddress = async (lat: number, lng: number) => {
    setIsResolving(true);
    try {
      const response = await fetch(`/api/maps/reverse?lat=${lat}&lng=${lng}`);
      if (!response.ok) throw new Error("Reverse geocode request failed");

      const body = (await response.json()) as { address: string; coordinates: Coordinates };
      setAddress(body.address);
      setCoordinates(body.coordinates);
      notify.success("Location selected from map.");
    } catch {
      notify.error("Could not resolve location from map. Try again.");
    } finally {
      setIsResolving(false);
    }
  };

  const handleMapSelect = (event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const relativeX = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
    const relativeY = Math.min(Math.max((event.clientY - box.top) / box.height, 0), 1);
    const selected = toLatLng(relativeX, relativeY);
    void resolveAddress(selected.lat, selected.lng);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      notify.error("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void resolveAddress(position.coords.latitude, position.coords.longitude);
      },
      () => {
        notify.error("Unable to access your current location.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  const persistSavedAddress = (value: string) => {
    const nextAddress = value.trim();
    if (!nextAddress || typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(SAVED_ADDRESSES_KEY);
      const current = raw ? (JSON.parse(raw) as unknown) : [];
      const entries = Array.isArray(current) ? current.filter((entry): entry is string => typeof entry === "string") : [];
      const deduped = [nextAddress, ...entries.filter((entry) => entry !== nextAddress)].slice(0, 12);
      window.localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(deduped));
    } catch {
      // Ignore storage errors and continue submitting location updates to the server.
    }
  };

  return (
    <section className="space-y-4 p-1">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-background-app p-1">
        <button
          type="button"
          onClick={() => setMode("input")}
          className={`h-9 rounded-lg text-sm font-semibold ${mode === "input" ? "bg-primary-500 text-white" : "text-text-secondary"}`}
        >
          Input Address
        </button>
        <button
          type="button"
          onClick={() => setMode("map")}
          className={`h-9 rounded-lg text-sm font-semibold ${mode === "map" ? "bg-primary-500 text-white" : "text-text-secondary"}`}
        >
          Select on Map
        </button>
      </div>

      {mode === "input" ? (
        <AddressAutocomplete
          label="Delivery Location"
          name="addressInput"
          placeholder="Type your barangay, street, or landmark"
          value={address}
          onValueChange={setAddress}
          onCoordinateSelect={(value) => setCoordinates(value)}
        />
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleMapSelect}
            className="relative h-52 w-full overflow-hidden rounded-2xl border border-border-muted bg-[radial-gradient(120%_100%_at_0%_0%,_#dff1ff_0%,_#bfe3ff_45%,_#edf7ff_100%)]"
          >
            <div className="absolute inset-0 bg-[linear-gradient(transparent_24px,rgba(30,136,229,0.14)_25px),linear-gradient(90deg,transparent_24px,rgba(30,136,229,0.14)_25px)] bg-[size:25px_25px]" />
            {coordinates ? (
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500 px-2 py-1 text-xs font-semibold text-white shadow">
                Pinned
              </span>
            ) : (
              <span className="absolute inset-x-0 bottom-3 text-center text-xs font-semibold text-primary-500">
                Tap anywhere to pin your location
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="h-10 rounded-xl border border-border-muted px-3 text-sm font-semibold text-primary-500"
          >
            Use my current location
          </button>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">Selected Address</label>
        <input
          required
          name="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-text-primary"
        />
      </div>

      <input type="hidden" name="lat" value={coordinates?.lat ?? ""} />
      <input type="hidden" name="lng" value={coordinates?.lng ?? ""} />

      <button
        type="submit"
        onClick={() => persistSavedAddress(address)}
        disabled={isResolving}
        className="h-11 w-full rounded-xl bg-primary-500 text-sm font-semibold text-white disabled:opacity-70"
      >
        {isResolving ? "Resolving map point..." : "Save Location"}
      </button>
    </section>
  );
}
