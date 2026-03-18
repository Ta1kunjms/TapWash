"use client";

import { AddressAutocomplete } from "@/components/customer/address-autocomplete";
import { InteractiveLocationMap } from "@/components/customer/interactive-location-map";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type AddressLabel = "home" | "work" | "partner" | "other";
type Mode = "list" | "create" | "edit";

type CustomerAddress = {
  id: string;
  label: AddressLabel;
  address_line: string;
  unit_details: string | null;
  delivery_instructions: string | null;
  lat: number;
  lng: number;
  is_default: boolean;
};

type Coordinates = { lat: number; lng: number };

const EMPTY_FORM = {
  address_line: "",
  unit_details: "",
  delivery_instructions: "",
  label: "home" as AddressLabel,
};

const LABELS: Array<{ value: AddressLabel; text: string; icon: string }> = [
  { value: "home", text: "Home", icon: "home" },
  { value: "work", text: "Work", icon: "briefcase" },
  { value: "partner", text: "Partner", icon: "heart" },
  { value: "other", text: "Other", icon: "plus-small" },
];

export function LocationPickerSheet() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>("list");
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeEditId, setActiveEditId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [currentLocationAddress, setCurrentLocationAddress] = useState("");
  const [currentLocationLoading, setCurrentLocationLoading] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [center, setCenter] = useState<Coordinates>({ lat: 6.1164, lng: 125.1716 });
  const [pin, setPin] = useState<Coordinates | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [searchProximity, setSearchProximity] = useState<Coordinates | null>(null);

  const activeEditAddress = useMemo(
    () => addresses.find((entry) => entry.id === activeEditId) ?? null,
    [addresses, activeEditId],
  );

  useEffect(() => {
    const onOpen = () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsClosing(false);
      setOpen(true);
      void loadAddresses();
      void loadCurrentLocation();
    };
    window.addEventListener("tapwash:open-location-sheet", onOpen);
    return () => window.removeEventListener("tapwash:open-location-sheet", onOpen);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customer/addresses", { cache: "no-store" });
      const body = (await response.json()) as { addresses?: CustomerAddress[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to load addresses");
      setAddresses(body.addresses ?? []);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Unable to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const closeSheet = () => {
    if (!open || isClosing) return;

    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
      setMode("list");
      setActiveEditId(null);
      closeTimerRef.current = null;
    }, 180);
  };

  const loadCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setCurrentLocation(null);
      setCurrentLocationAddress("Geolocation unavailable on this device");
      return;
    }

    setCurrentLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCurrentLocation(coords);
        setSearchProximity(coords);
        setCurrentLocationAddress(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);

        try {
          const response = await fetch(`/api/maps/reverse?lat=${coords.lat}&lng=${coords.lng}`, { cache: "no-store" });
          const body = (await response.json()) as { address?: string };
          if (response.ok && body.address) {
            setCurrentLocationAddress(body.address);
          }
        } catch {
          // Keep coordinate fallback if reverse geocoding fails.
        } finally {
          setCurrentLocationLoading(false);
        }
      },
      () => {
        setCurrentLocation(null);
        setCurrentLocationAddress("Location permission denied");
        setCurrentLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  const openCreate = () => {
    setMode("create");
    setActiveEditId(null);
    setForm(EMPTY_FORM);
    setPin(null);

    if (currentLocation) {
      setCenter(currentLocation);
      setPin(currentLocation);
      setSearchProximity(currentLocation);
      if (currentLocationAddress) {
        setForm((prev) => ({ ...prev, address_line: currentLocationAddress }));
      }
      return;
    }

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const current = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCenter(current);
        setPin(current);
        setSearchProximity(current);
        void reverseGeocodeAndFill(current);
      },
      () => {
        notify.warning("Location permission denied. Enter your address manually.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  const openEdit = (address: CustomerAddress) => {
    setMode("edit");
    setActiveEditId(address.id);
    setForm({
      address_line: address.address_line,
      unit_details: address.unit_details ?? "",
      delivery_instructions: address.delivery_instructions ?? "",
      label: address.label,
    });
    const coords = { lat: address.lat, lng: address.lng };
    setCenter(coords);
    setPin(coords);
    setSearchProximity(coords);
  };

  const applyCurrentLocation = () => {
    if (!currentLocation) {
      notify.warning("Current location is unavailable. Please allow location access.");
      return;
    }

    setMode("create");
    setActiveEditId(null);
    setCenter(currentLocation);
    setPin(currentLocation);
    setSearchProximity(currentLocation);
    setForm({
      ...EMPTY_FORM,
      address_line: currentLocationAddress,
    });
  };

  const reverseGeocodeAndFill = async (coords: Coordinates) => {
    setPinLoading(true);
    try {
      const response = await fetch(`/api/maps/reverse?lat=${coords.lat}&lng=${coords.lng}`, { cache: "no-store" });
      const body = (await response.json()) as { address?: string; error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to resolve address");
      setForm((prev) => ({ ...prev, address_line: body.address ?? prev.address_line }));
    } catch {
      // Keep manual entry available if reverse geocoding fails.
    } finally {
      setPinLoading(false);
    }
  };

  const handlePinChange = (coords: Coordinates) => {
    setPin(coords);
    setCenter(coords);
    setSearchProximity(coords);
    void reverseGeocodeAndFill(coords);
  };

  const saveAddress = async () => {
    const address = form.address_line.trim();
    if (!address) {
      notify.warning("Address is required.");
      return;
    }
    if (!pin) {
      notify.warning("Select an exact location on the map.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: mode === "edit" ? activeEditId : undefined,
        label: form.label,
        address_line: address,
        unit_details: form.unit_details.trim() || null,
        delivery_instructions: form.delivery_instructions.trim() || null,
        lat: pin.lat,
        lng: pin.lng,
        is_default: true,
      };

      const response = await fetch("/api/customer/addresses", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { address?: CustomerAddress; error?: string };
      if (!response.ok || !body.address) throw new Error(body.error || "Unable to save address");

      await loadAddresses();
      window.dispatchEvent(new CustomEvent("tapwash:location-updated", { detail: { label: body.address.address_line } }));
      router.refresh();
      notify.success("Address saved.");
      closeSheet();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Unable to save address");
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    try {
      const response = await fetch("/api/customer/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "set_default" }),
      });
      const body = (await response.json()) as { address?: CustomerAddress; error?: string };
      if (!response.ok || !body.address) throw new Error(body.error || "Unable to update default address");
      await loadAddresses();
      window.dispatchEvent(new CustomEvent("tapwash:location-updated", { detail: { label: body.address.address_line } }));
      router.refresh();
      notify.success("Default address updated.");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Unable to update default address");
    }
  };

  const deleteAddress = async (id: string) => {
    const confirmed = window.confirm("Delete this address?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/customer/addresses/${id}`, { method: "DELETE" });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to delete address");
      await loadAddresses();
      router.refresh();
      notify.success("Address removed.");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Unable to delete address");
    }
  };

  const onSearchCoordinateSelect = (coords: Coordinates | null) => {
    if (!coords) return;
    setPin(coords);
    setCenter(coords);
    setSearchProximity(coords);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]",
          isClosing ? "animate-location-overlay-out" : "animate-location-overlay-in",
        )}
        aria-label="Close location sheet"
        onClick={closeSheet}
      />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 mx-auto flex max-h-[92vh] w-full max-w-md flex-col overscroll-contain rounded-t-[1.8rem] bg-background-app p-4 shadow-[0_-14px_28px_rgba(0,0,0,0.18)]",
          isClosing ? "animate-location-sheet-out" : "animate-location-sheet-in",
        )}
      >
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-300" />

        {mode === "list" ? (
          <section className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-[#233f6e]">Select Location</h2>
              <button type="button" onClick={closeSheet} className="rounded-full p-2 text-[#0081c9] hover:bg-white/60" aria-label="Close">
                <FlaticonIcon name="cross-small" className="text-lg" />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#c8dbea] bg-white/95 px-3 py-2">
              <div className="flex items-center gap-2">
                <FlaticonIcon name="globe" className="text-[#28517d]" />
                <p className="text-sm font-bold text-[#233f6e]">Philippines</p>
              </div>
              <button type="button" onClick={openCreate} className="text-sm font-semibold text-[#2b79bf] underline decoration-[#9bc6e9] underline-offset-2">
                Change
              </button>
            </div>

            <article className="rounded-2xl border border-[#c8dbea] bg-white/95 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-black text-[#233f6e]">Current Location</p>
                <button
                  type="button"
                  onClick={applyCurrentLocation}
                  className="rounded-full border border-[#b9d7ed] px-2 py-1 text-xs font-semibold text-[#1f93d8]"
                >
                  Use this location
                </button>
              </div>
              <div className="mb-2 overflow-hidden rounded-xl">
                {currentLocation ? (
                  <InteractiveLocationMap center={currentLocation} pin={currentLocation} onSelect={() => {}} interactive={false} />
                ) : (
                  <div className="h-32 rounded-xl bg-[radial-gradient(120%_100%_at_0%_0%,_#dff1ff_0%,_#bfe3ff_45%,_#edf7ff_100%)]" />
                )}
              </div>
              <p className="line-clamp-2 text-sm font-semibold text-[#28517d]">
                {currentLocationLoading ? "Getting your current location..." : currentLocationAddress || "Location unavailable"}
              </p>
            </article>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-2 pb-2">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#b8d7ec] bg-white/75 px-3 py-6 text-center">
                  <p className="text-sm font-semibold text-[#5f86ab]">No saved addresses yet.</p>
                  <p className="mt-1 text-xs text-[#7398bc]">Tap Add New Address to create your first delivery location.</p>
                </div>
              ) : (
                addresses.map((address) => (
                  <article key={address.id} className="rounded-2xl border border-[#c8dbea] bg-white/95 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" onClick={() => setDefault(address.id)} className="flex min-w-0 flex-1 items-start gap-2 text-left">
                        <span
                          className={cn(
                            "mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full border-2",
                            address.is_default ? "border-[#1f93d8]" : "border-[#9ec4e4]",
                          )}
                        >
                          <span className={cn("h-2.5 w-2.5 rounded-full", address.is_default ? "bg-[#1f93d8]" : "bg-transparent")} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-black uppercase text-[#2f5f8f]">{address.label}</span>
                          <span className="block line-clamp-2 text-sm font-semibold text-[#233f6e]">{address.address_line}</span>
                          {address.unit_details ? <span className="block text-xs text-[#5f86ab]">{address.unit_details}</span> : null}
                        </span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(address)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#1f93d8] hover:bg-[#e8f4fc]"
                          aria-label="Edit address"
                        >
                          <FlaticonIcon name="pen-clip" className="text-sm" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAddress(address.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50"
                          aria-label="Delete address"
                        >
                          <FlaticonIcon name="trash" className="text-sm" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}

              <button
                type="button"
                onClick={openCreate}
                className="flex w-full items-center justify-between rounded-2xl border border-[#c8dbea] bg-white/90 px-3 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <FlaticonIcon name="plus" className="text-[#1f93d8]" />
                  <span className="text-sm font-bold text-[#28517d]">Add New Address</span>
                </div>
                <FlaticonIcon name="angle-small-right" className="text-[#1f93d8]" />
              </button>
            </div>
          </section>
        ) : (
          <section className="flex min-h-0 flex-1 flex-col">
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  setMode("list");
                  setActiveEditId(null);
                }}
                className="absolute left-0 inline-flex h-10 w-10 items-center justify-center rounded-full text-[#0081c9] hover:bg-white/70"
                aria-label="Back"
              >
                <FlaticonIcon name="angle-small-left" className="text-2xl" />
              </button>
              <h2 className="text-xl font-black text-[#233f6e]">{mode === "create" ? "Add Address" : "Edit Address"}</h2>
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-3 pr-0.5">
              <InteractiveLocationMap
                center={pin ?? center}
                pin={pin ?? center}
                onSelect={(coords) => {
                  setPin(coords);
                  void handlePinChange(coords);
                }}
              />

              <AddressAutocomplete
                label="Address"
                name="addressInput"
                placeholder="Search address"
                value={form.address_line}
                proximity={searchProximity}
                onValueChange={(value) => setForm((prev) => ({ ...prev, address_line: value }))}
                onCoordinateSelect={onSearchCoordinateSelect}
              />

              <div className="grid grid-cols-1 gap-2">
                <input
                  value={form.unit_details}
                  onChange={(event) => setForm((prev) => ({ ...prev, unit_details: event.target.value }))}
                  placeholder="Floor/Unit/Room #"
                  className="h-11 w-full rounded-xl border border-border-muted bg-white px-3 text-sm text-text-primary"
                />
                <textarea
                  value={form.delivery_instructions}
                  onChange={(event) => setForm((prev) => ({ ...prev, delivery_instructions: event.target.value }))}
                  maxLength={300}
                  placeholder="Delivery instructions (landmark, rider notes)"
                  className="min-h-20 w-full rounded-xl border border-border-muted bg-white px-3 py-2 text-sm text-text-primary"
                />
                <p className="text-right text-xs text-text-muted">{form.delivery_instructions.length}/300</p>
              </div>

              <div>
                <p className="mb-2 text-sm font-bold text-[#233f6e]">Add a label</p>
                <div className="grid grid-cols-4 gap-2">
                  {LABELS.map((item) => {
                    const selected = form.label === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, label: item.value }))}
                        className={cn(
                          "rounded-xl border px-2 py-2 text-center",
                          selected ? "border-[#1f93d8] bg-[#e6f4fd]" : "border-border-muted bg-white",
                        )}
                      >
                        <FlaticonIcon name={item.icon} className="text-base text-[#1f93d8]" />
                        <p className="mt-1 text-xs font-semibold text-[#28517d]">{item.text}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {mode === "edit" && activeEditAddress ? (
                <p className="text-center text-xs text-text-muted">Editing: {activeEditAddress.address_line}</p>
              ) : null}
            </div>

            <div className="mt-3 bg-gradient-to-t from-background-app via-background-app/95 to-transparent pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                disabled={saving || pinLoading}
                onClick={saveAddress}
                className="h-12 w-full rounded-xl bg-[#1f93d8] text-sm font-bold text-white disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save and continue"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
