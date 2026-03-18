import { z } from "zod";

const serviceSelectionSchema = z.object({
  serviceId: z.uuid(),
  loads: z.number().int().min(1).max(20),
  selectedOptionIds: z.array(z.uuid()).default([]),
});

export const bookOrderSchema = z.object({
  shopId: z.uuid(),
  serviceId: z.uuid(),
  weightEstimate: z.number().min(0).max(250),
  selectedOptionIds: z.array(z.uuid()).default([]),
  serviceSelections: z.array(serviceSelectionSchema).min(1).default([]),
  pickupDate: z.iso.datetime(),
  deliveryDate: z.iso.datetime().optional(),
  deliveryFee: z.number().min(0),
  tipAmount: z.number().min(0).default(0),
  contactPhone: z.string().regex(/^\+63\d{10}$/),
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
}).superRefine((value, context) => {
  const pickup = new Date(value.pickupDate);
  const delivery = value.deliveryDate ? new Date(value.deliveryDate) : null;

  if (Number.isNaN(pickup.getTime())) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pickupDate"],
      message: "Invalid pickup date",
    });
  }

  if (delivery && Number.isNaN(delivery.getTime())) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deliveryDate"],
      message: "Invalid delivery date",
    });
  }

  if (delivery && !Number.isNaN(pickup.getTime()) && delivery.getTime() < pickup.getTime()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deliveryDate"],
      message: "Delivery date cannot be before pickup date",
    });
  }
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
