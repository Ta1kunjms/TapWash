"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export function useOrderRealtime(orderId: string, onStatus: (status: string) => void) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          onStatus(String(payload.new.status));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onStatus, orderId]);
}
