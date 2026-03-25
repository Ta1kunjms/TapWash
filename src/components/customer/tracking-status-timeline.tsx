"use client";

import { ORDER_STATUS_STEPS } from "@/lib/constants";
import { useOrderRealtime } from "@/hooks/use-order-realtime";
import type { OrderStatus } from "@/types/domain";
import { useMemo, useState } from "react";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  picked_up: "Picked Up",
  washing: "Washing",
  drying: "Drying",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function TrackingStatusTimeline({ orderId, initialStatus }: { orderId: string; initialStatus: OrderStatus }) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  useOrderRealtime(orderId, (nextStatus) => setStatus(nextStatus as OrderStatus));

  const currentIndex = useMemo(() => ORDER_STATUS_STEPS.indexOf(status), [status]);

  return (
    <section className="rounded-[1rem] border border-[#d8e8f4] bg-[#f9fcff] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-[0.9rem] font-black text-[#5e88aa]">Request Status</h2>
        {status !== "completed" && status !== "cancelled" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#1d8f57]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
            Live
          </span>
        ) : null}
      </div>

      <div className="space-y-2">
        {ORDER_STATUS_STEPS.map((step, index) => {
          const complete = status !== "cancelled" && index < currentIndex;
          const active = status !== "cancelled" && index === currentIndex;
          const pending = !complete && !active;

          return (
            <div key={step} className="flex items-center gap-2.5">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[0.6rem] font-black ${
                  complete
                    ? "border-[#1d94db] bg-[#1d94db] text-white"
                    : active
                      ? "border-[#1d94db] bg-white text-[#1d94db]"
                      : "border-[#c9d8e6] bg-white text-[#9bb4c8]"
                }`}
                aria-hidden="true"
              >
                {complete ? "\u2713" : index + 1}
              </span>
              <p
                className={`text-[0.8rem] font-semibold ${
                  active ? "text-[#1d94db]" : pending ? "text-[#8ba8be]" : "text-[#5f84a2]"
                }`}
              >
                {STATUS_LABELS[step]}
              </p>
            </div>
          );
        })}
        {status === "cancelled" ? <p className="text-[0.8rem] font-semibold text-rose-500">This request was cancelled.</p> : null}
      </div>
    </section>
  );
}