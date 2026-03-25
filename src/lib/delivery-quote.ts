import { geocodeAddress, type Coordinates } from "@/lib/geocoding";
const ORS_API_KEY = process.env.ORS_API_KEY?.trim();
const REQUEST_TIMEOUT_MS = 10000;

const PHILIPPINES_BOUNDS = {
  minLat: 4.5,
  maxLat: 21.5,
  minLng: 116.0,
  maxLng: 127.5,
};

export class DeliveryQuoteError extends Error {
  code:
    | "MISSING_API_KEY"
    | "INVALID_INPUT"
    | "UNRESOLVED_PICKUP"
    | "UNRESOLVED_DROPOFF"
    | "UNRESOLVED_SHOP"
    | "OUTSIDE_SERVICE_AREA"
    | "ROUTE_UNAVAILABLE";

  constructor(
    code:
      | "MISSING_API_KEY"
      | "INVALID_INPUT"
      | "UNRESOLVED_PICKUP"
      | "UNRESOLVED_DROPOFF"
      | "UNRESOLVED_SHOP"
      | "OUTSIDE_SERVICE_AREA"
      | "ROUTE_UNAVAILABLE",
    message: string,
  ) {
    super(message);
    this.name = "DeliveryQuoteError";
    this.code = code;
  }
}

function isCoordinateInPhilippines(coord: Coordinates) {
  return (
    coord.lat >= PHILIPPINES_BOUNDS.minLat &&
    coord.lat <= PHILIPPINES_BOUNDS.maxLat &&
    coord.lng >= PHILIPPINES_BOUNDS.minLng &&
    coord.lng <= PHILIPPINES_BOUNDS.maxLng
  );
}

function toCoordinate(lat: number | null | undefined, lng: number | null | undefined): Coordinates | null {
  if (typeof lat !== "number" || typeof lng !== "number") {
    return null;
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

export function haversineDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadius = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const deltaLat = toRad(to.lat - from.lat);
  const deltaLng = toRad(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

export function estimateFeeAndEta(distanceKm: number) {
  const normalizedDistance = Math.max(0.5, distanceKm);
  const fee = Math.round(39 + normalizedDistance * 11);
  const etaMinutes = Math.round(20 + normalizedDistance * 6);

  return {
    fee,
    etaMin: Math.max(25, etaMinutes),
    etaMax: Math.max(40, etaMinutes + 18),
  };
}

interface ORSRouteResponse {
  features?: Array<{
    geometry?: {
      coordinates?: Array<[number, number]>;
    };
    properties?: {
      summary?: {
        distance?: number;
        duration?: number;
      };
    };
  }>;
}

async function requestOrsRoute(coordinates: Array<[number, number]>): Promise<{
  distanceKm: number;
  durationMin: number;
  path: Array<Coordinates>;
} | null> {
  if (!ORS_API_KEY) {
    return null;
  }

  const orsUrl = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(orsUrl, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ coordinates }),
    });

    if (!response.ok) {
      return null;
    }

    const data: ORSRouteResponse = await response.json();
    const summary = data.features?.[0]?.properties?.summary;
    const distanceMeters = summary?.distance;
    const durationSeconds = summary?.duration;
    const routeCoordinates = data.features?.[0]?.geometry?.coordinates;

    if (
      typeof distanceMeters !== "number" ||
      typeof durationSeconds !== "number" ||
      distanceMeters <= 0 ||
      !Array.isArray(routeCoordinates) ||
      routeCoordinates.length === 0
    ) {
      return null;
    }

    const path = routeCoordinates
      .map(([lng, lat]) => {
        if (typeof lat !== "number" || typeof lng !== "number") {
          return null;
        }

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }

        return { lat, lng };
      })
      .filter((point): point is Coordinates => point !== null);

    if (path.length === 0) {
      return null;
    }

    return {
      distanceKm: Number((distanceMeters / 1000).toFixed(2)),
      durationMin: Math.round(durationSeconds / 60),
      path,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getDeliveryQuote(input: {
  pickupAddress: string;
  dropoffAddress: string;
  shopLocation: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
}) {
  if (!input.pickupAddress?.trim() || !input.dropoffAddress?.trim() || !input.shopLocation?.trim()) {
    throw new DeliveryQuoteError("INVALID_INPUT", "Pickup, drop-off, and shop addresses are required.");
  }

  const resolveRequiredAddress = async (
    address: string,
    fieldCode: "UNRESOLVED_PICKUP" | "UNRESOLVED_DROPOFF" | "UNRESOLVED_SHOP",
    fieldLabel: string,
  ): Promise<Coordinates> => {
    const coordinates = await geocodeAddress(address, ["ph"]);
    if (coordinates) return coordinates;
    throw new DeliveryQuoteError(fieldCode, `Unable to resolve ${fieldLabel}.`);
  };

  const pickupFromInput = toCoordinate(input.pickupLat, input.pickupLng);
  const dropoffFromInput = toCoordinate(input.dropoffLat, input.dropoffLng);

  const [pickup, dropoff, shop] = await Promise.all([
    pickupFromInput ?? resolveRequiredAddress(input.pickupAddress, "UNRESOLVED_PICKUP", "pickup address"),
    dropoffFromInput ?? resolveRequiredAddress(input.dropoffAddress, "UNRESOLVED_DROPOFF", "drop-off address"),
    resolveRequiredAddress(input.shopLocation, "UNRESOLVED_SHOP", "shop location"),
  ]);

  if (!isCoordinateInPhilippines(pickup) || !isCoordinateInPhilippines(dropoff) || !isCoordinateInPhilippines(shop)) {
    throw new DeliveryQuoteError("OUTSIDE_SERVICE_AREA", "Address is outside the current service area.");
  }

  if (!ORS_API_KEY) {
    throw new DeliveryQuoteError("MISSING_API_KEY", "Map configuration is incomplete. Please contact support.");
  }

  const fullRoute = await requestOrsRoute([
    [shop.lng, shop.lat],
    [pickup.lng, pickup.lat],
    [dropoff.lng, dropoff.lat],
  ]);

  if (!fullRoute) {
    throw new DeliveryQuoteError("ROUTE_UNAVAILABLE", "Unable to calculate a route right now.");
  }

  const shopToPickupRoute = await requestOrsRoute([
    [shop.lng, shop.lat],
    [pickup.lng, pickup.lat],
  ]);

  const quote = estimateFeeAndEta(fullRoute.distanceKm);

  return {
    pickup,
    dropoff,
    shop,
    distanceKm: fullRoute.distanceKm,
    fee: quote.fee,
    etaMin: Math.max(25, Math.round(fullRoute.durationMin)),
    etaMax: Math.max(40, Math.round(fullRoute.durationMin + 18)),
    routePath: fullRoute.path,
    shopToPickupDistanceKm: shopToPickupRoute?.distanceKm ?? null,
    shopToPickupPath: shopToPickupRoute?.path ?? [],
  };
}
