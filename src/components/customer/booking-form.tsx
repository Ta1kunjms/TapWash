"use client";

import { createOrderAction } from "@/app/actions/orders";
import { AddressAutocomplete } from "@/components/customer/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";

type ShopService = {
  id: string;
  name: string;
  price_per_kg: number;
};

type ShopItem = {
  id: string;
  shop_name: string;
  location: string;
  price_per_kg: number;
  services: ShopService[];
};

export function BookingForm({ shops }: { shops: ShopItem[] }) {
  const [shopId, setShopId] = useState(shops[0]?.id ?? "");
  const [weight, setWeight] = useState<number>(3);
  const [deliveryFee, setDeliveryFee] = useState<number>(49);
  const [promoCode, setPromoCode] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const [etaMax, setEtaMax] = useState<number | null>(null);
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);

  const selectedShop = useMemo(
    () => shops.find((shop) => shop.id === shopId) ?? shops[0],
    [shopId, shops],
  );

  const services = selectedShop?.services ?? [];
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");

  const selectedService = services.find((service) => service.id === serviceId) ?? services[0];
  const estimate = Number((Number(selectedService?.price_per_kg ?? 0) * weight + deliveryFee).toFixed(2));

  useEffect(() => {
    if (!pickupAddress || !dropoffAddress || !selectedShop?.location) return;

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch("/api/maps/quote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            pickupAddress,
            dropoffAddress,
            shopLocation: selectedShop.location,
          }),
        });

        if (!response.ok) return;

        const result = (await response.json()) as {
          fee: number;
          etaMin: number;
          etaMax: number;
          distanceKm: number;
          pickup: { lat: number; lng: number };
          dropoff: { lat: number; lng: number };
        };

        setDeliveryFee(result.fee);
        setEtaMin(result.etaMin);
        setEtaMax(result.etaMax);
        setDistanceKm(result.distanceKm);
        setPickupLat(result.pickup.lat);
        setPickupLng(result.pickup.lng);
        setDropoffLat(result.dropoff.lat);
        setDropoffLng(result.dropoff.lng);
      } catch {
        return;
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [dropoffAddress, pickupAddress, selectedShop?.location]);

  return (
    <form action={createOrderAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">Laundry Shop</label>
        <select
          required
          name="shopId"
          value={shopId}
          onChange={(event) => {
            const nextShopId = event.target.value;
            setShopId(nextShopId);
            const nextShop = shops.find((shop) => shop.id === nextShopId);
            setServiceId(nextShop?.services[0]?.id ?? "");
          }}
          className="h-11 w-full rounded-2xl border border-border-muted bg-white px-3 text-sm"
        >
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.shop_name} · {shop.location}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">Service</label>
        <select
          required
          name="serviceId"
          value={serviceId}
          onChange={(event) => setServiceId(event.target.value)}
          className="h-11 w-full rounded-2xl border border-border-muted bg-white px-3 text-sm"
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} · ₱{service.price_per_kg}/kg
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">Weight (kg)</label>
          <Input
            required
            name="weightEstimate"
            type="number"
            min={1}
            step="0.5"
            value={weight}
            onChange={(event) => setWeight(Number(event.target.value))}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">Delivery Fee</label>
          <Input
            required
            name="deliveryFee"
            type="number"
            min={0}
            step="1"
            value={deliveryFee}
            onChange={(event) => setDeliveryFee(Number(event.target.value))}
            readOnly
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-text-secondary">Pickup Schedule</label>
        <Input required name="pickupDate" type="datetime-local" />
      </div>

      <AddressAutocomplete
        label="Pickup Address"
        name="pickupAddress"
        placeholder="House no., street, barangay"
        value={pickupAddress}
        onValueChange={setPickupAddress}
        onCoordinateSelect={(coordinates) => {
          setPickupLat(coordinates?.lat ?? null);
          setPickupLng(coordinates?.lng ?? null);
        }}
      />

      <AddressAutocomplete
        label="Drop-off Address"
        name="dropoffAddress"
        placeholder="Delivery return address"
        value={dropoffAddress}
        onValueChange={setDropoffAddress}
        onCoordinateSelect={(coordinates) => {
          setDropoffLat(coordinates?.lat ?? null);
          setDropoffLng(coordinates?.lng ?? null);
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">Voucher</label>
          <Input
            name="promoCode"
            value={promoCode}
            onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
            placeholder="WELCOME100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-text-secondary">Payment</label>
          <select
            name="paymentMethod"
            defaultValue="cod"
            className="h-11 w-full rounded-2xl border border-border-muted bg-white px-3 text-sm"
          >
            <option value="cod">Cash on Delivery</option>
            <option value="gcash">GCash</option>
            <option value="card">Card</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-border-muted bg-background-app p-3">
        <p className="text-xs text-text-secondary">Estimated total</p>
        <p className="text-xl font-bold text-text-primary">₱{estimate}</p>
        <p className="text-xs text-text-muted">
          ETA: {etaMin && etaMax ? `${etaMin}-${etaMax} mins` : "calculating"}
          {distanceKm ? ` · ${distanceKm} km` : ""}
        </p>
      </div>

      <input type="hidden" name="pickupLat" value={pickupLat ?? ""} />
      <input type="hidden" name="pickupLng" value={pickupLng ?? ""} />
      <input type="hidden" name="dropoffLat" value={dropoffLat ?? ""} />
      <input type="hidden" name="dropoffLng" value={dropoffLng ?? ""} />
      <input type="hidden" name="distanceKm" value={distanceKm ?? ""} />
      <input type="hidden" name="etaMinutes" value={etaMax ?? ""} />

      <Button type="submit" className="w-full" disabled={!shopId || !serviceId || !selectedService}>
        Confirm booking
      </Button>
    </form>
  );
}
