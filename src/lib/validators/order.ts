import { z } from "zod";

export const bookOrderSchema = z.object({
  shopId: z.uuid(),
  serviceId: z.uuid(),
  weightEstimate: z.number().min(1).max(100),
  selectedOptionIds: z.array(z.uuid()).default([]),
  pickupDate: z.iso.datetime(),
  deliveryDate: z.iso.datetime().optional(),
  deliveryFee: z.number().min(0),
  tipAmount: z.number().min(0).default(0),
  contactPhone: z.string().min(7).max(30),
  deliveryInstructions: z.string().max(500).optional(),
  riderNotes: z.string().max(500).optional(),
  pickupAddress: z.string().min(5).max(255),
  dropoffAddress: z.string().min(5).max(255),
  promoCode: z.string().min(3).max(30).optional(),
  paymentMethod: z.enum(["cod", "gcash", "card"]),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  distanceKm: z.number().optional(),
  etaMinutes: z.number().int().optional(),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.uuid(),
  nextStatus: z.enum([
    "pending",
    "accepted",
    "picked_up",
    "washing",
    "drying",
    "ready",
    "out_for_delivery",
    "completed",
    "cancelled",
  ]),
});
