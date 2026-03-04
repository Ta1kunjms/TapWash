"use client";

import { ORDER_STATUS_STEPS } from "@/lib/constants";
import { useOrderRealtime } from "@/hooks/use-order-realtime";
import { useState } from "react";

export function OrderTracker({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  useOrderRealtime(orderId, setStatus);

  const currentIndex = ORDER_STATUS_STEPS.indexOf(status as (typeof ORDER_STATUS_STEPS)[number]);

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm font-semibold text-primary-500">Live status: {status}</p>
      <div className="grid grid-cols-4 gap-1 text-[10px]">
        {ORDER_STATUS_STEPS.map((step, index) => {
          const isDone = currentIndex >= 0 && index <= currentIndex;
          return (
            <div
              key={step}
              className={`rounded-lg px-2 py-1 text-center ${isDone ? "bg-primary-500 text-white" : "bg-white text-text-muted"}`}
            >
              {step.replaceAll("_", " ")}
            </div>
          );
        })}
      </div>
    </div>
  );
}
