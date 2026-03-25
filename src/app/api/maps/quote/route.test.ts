import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/delivery-quote", async () => {
  const actual = await vi.importActual<typeof import("@/lib/delivery-quote")>("@/lib/delivery-quote");
  return {
    ...actual,
    getDeliveryQuote: vi.fn(),
  };
});

import { DeliveryQuoteError, getDeliveryQuote } from "@/lib/delivery-quote";
import { POST } from "@/app/api/maps/quote/route";

function createValidRequestBody() {
  return {
    pickupAddress: "Calumpang, General Santos, Philippines",
    dropoffAddress: "City Heights, General Santos, Philippines",
    shopLocation: "Poblacion, General Santos, Philippines",
    pickupLat: 6.106,
    pickupLng: 125.174,
    dropoffLat: 6.121,
    dropoffLng: 125.189,
  };
}

describe("POST /api/maps/quote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid payload", async () => {
    const request = new Request("http://localhost/api/maps/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pickupAddress: "abc" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 422 for unresolved address errors", async () => {
    vi.mocked(getDeliveryQuote).mockRejectedValueOnce(
      new DeliveryQuoteError("UNRESOLVED_PICKUP", "Unable to resolve pickup address."),
    );

    const request = new Request("http://localhost/api/maps/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidRequestBody()),
    });

    const response = await POST(request);
    expect(response.status).toBe(422);
  });

  it("returns 503 for route provider failure", async () => {
    vi.mocked(getDeliveryQuote).mockRejectedValueOnce(
      new DeliveryQuoteError("ROUTE_UNAVAILABLE", "Unable to calculate a route right now."),
    );

    const request = new Request("http://localhost/api/maps/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidRequestBody()),
    });

    const response = await POST(request);
    expect(response.status).toBe(503);
  });

  it("returns 500 for missing map key", async () => {
    vi.mocked(getDeliveryQuote).mockRejectedValueOnce(
      new DeliveryQuoteError("MISSING_API_KEY", "Map configuration is incomplete. Please contact support."),
    );

    const request = new Request("http://localhost/api/maps/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidRequestBody()),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it("returns quote payload on success", async () => {
    vi.mocked(getDeliveryQuote).mockResolvedValueOnce({
      pickup: { lat: 6.106, lng: 125.174 },
      dropoff: { lat: 6.121, lng: 125.189 },
      shop: { lat: 6.114, lng: 125.181 },
      distanceKm: 4.2,
      fee: 85,
      etaMin: 22,
      etaMax: 40,
      routePath: [
        { lat: 6.114, lng: 125.181 },
        { lat: 6.11, lng: 125.176 },
        { lat: 6.106, lng: 125.174 },
        { lat: 6.116, lng: 125.182 },
        { lat: 6.121, lng: 125.189 },
      ],
      shopToPickupDistanceKm: 1.6,
      shopToPickupPath: [
        { lat: 6.114, lng: 125.181 },
        { lat: 6.11, lng: 125.176 },
        { lat: 6.106, lng: 125.174 },
      ],
    });

    const request = new Request("http://localhost/api/maps/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createValidRequestBody()),
    });

    const response = await POST(request);
    const body = (await response.json()) as {
      fee: number;
      distanceKm: number;
      shopToPickupDistanceKm: number | null;
      shopToPickupPath: Array<{ lat: number; lng: number }>;
    };

    expect(response.status).toBe(200);
    expect(body.fee).toBe(85);
    expect(body.distanceKm).toBe(4.2);
    expect(body.shopToPickupDistanceKm).toBe(1.6);
    expect(body.shopToPickupPath).toHaveLength(3);
  });
});
