import { describe, expect, it } from "vitest";
import { bookOrderSchema } from "@/lib/validators/order";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    shopId: "11111111-1111-4111-8111-111111111111",
    serviceId: "22222222-2222-4222-8222-222222222222",
    weightEstimate: 12.5,
    selectedOptionIds: ["33333333-3333-4333-8333-333333333333"],
    serviceSelections: [
      {
        serviceId: "22222222-2222-4222-8222-222222222222",
        loads: 2,
        selectedOptionIds: ["33333333-3333-4333-8333-333333333333"],
      },
    ],
    pickupDate: "2026-03-19T08:00:00.000Z",
    deliveryDate: "2026-03-19T12:00:00.000Z",
    deliveryFee: 49,
    tipAmount: 20,
    contactPhone: "+639123456789",
    deliveryInstructions: "Gate code 1234",
    riderNotes: "Call on arrival",
    pickupAddress: "123 Main Street, Barangay 1",
    dropoffAddress: "123 Main Street, Barangay 1",
    promoCode: "WELCOME100",
    paymentMethod: "cod",
    pickupLat: 6.11,
    pickupLng: 125.17,
    dropoffLat: 6.11,
    dropoffLng: 125.17,
    distanceKm: 4.8,
    etaMinutes: 38,
    ...overrides,
  };
}

describe("bookOrderSchema", () => {
  it("accepts a valid normalized payload", () => {
    const parsed = bookOrderSchema.parse(validPayload());
    expect(parsed.contactPhone).toBe("+639123456789");
  });

  it("rejects delivery earlier than pickup", () => {
    const result = bookOrderSchema.safeParse(
      validPayload({
        pickupDate: "2026-03-19T12:00:00.000Z",
        deliveryDate: "2026-03-19T08:00:00.000Z",
      }),
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "deliveryDate")).toBe(true);
    }
  });

  it("rejects non-normalized contact phone", () => {
    const result = bookOrderSchema.safeParse(validPayload({ contactPhone: "09123456789" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "contactPhone")).toBe(true);
    }
  });

  it("rejects unsupported payment methods", () => {
    const result = bookOrderSchema.safeParse(validPayload({ paymentMethod: "bank_transfer" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "paymentMethod")).toBe(true);
    }
  });
});
