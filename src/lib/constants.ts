import type { OrderStatus } from "@/types/domain";

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["picked_up", "cancelled"],
  picked_up: ["washing"],
  washing: ["drying"],
  drying: ["ready"],
  ready: ["out_for_delivery"],
  out_for_delivery: ["completed"],
  completed: [],
  cancelled: [],
};

export const PROTECTED_PREFIXES = {
  customer: "/customer",
  shop: "/shop",
  admin: "/admin",
} as const;

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  "pending",
  "accepted",
  "picked_up",
  "washing",
  "drying",
  "ready",
  "out_for_delivery",
  "completed",
];

export function getAllowedNextStatuses(status: OrderStatus) {
  return ORDER_TRANSITIONS[status] ?? [];
}
