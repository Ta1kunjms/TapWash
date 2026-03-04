"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type RiderLocation = {
  lat: number;
  lng: number;
  updated_at: string;
};

type DeliveryState = {
  status: string;
  eta_minutes: number | null;
};

export function useRiderTracking(orderId: string, initial: { location: RiderLocation | null; delivery: DeliveryState | null }) {
  const [location, setLocation] = useState<RiderLocation | null>(initial.location);
  const [delivery, setDelivery] = useState<DeliveryState | null>(initial.delivery);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`tracking-${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rider_locations", filter: `order_id=eq.${orderId}` },
        (payload) => {
          if (payload.new) {
            setLocation({
              lat: Number((payload.new as { lat: number }).lat),
              lng: Number((payload.new as { lng: number }).lng),
              updated_at: String((payload.new as { updated_at: string }).updated_at),
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "deliveries", filter: `order_id=eq.${orderId}` },
        (payload) => {
          setDelivery({
            status: String((payload.new as { status: string }).status),
            eta_minutes: Number((payload.new as { eta_minutes: number | null }).eta_minutes ?? 0) || null,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { location, delivery };
}
