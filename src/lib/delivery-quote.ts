import { geocodeAddress, type Coordinates } from "@/lib/geocoding";

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

export async function getDeliveryQuote(input: {
  pickupAddress: string;
  dropoffAddress: string;
  shopLocation: string;
}) {
  const resolveRequiredAddress = async (address: string, fieldName: string): Promise<Coordinates> => {
    const coordinates = await geocodeAddress(address, ["ph"]);
    if (coordinates) return coordinates;
    throw new Error(`Unable to resolve ${fieldName}`);
  };

  const [pickup, dropoff, shop] = await Promise.all([
    resolveRequiredAddress(input.pickupAddress, "pickup address"),
    resolveRequiredAddress(input.dropoffAddress, "drop-off address"),
    resolveRequiredAddress(input.shopLocation, "shop location"),
  ]);

  const distancePickupToShop = haversineDistanceKm(pickup, shop);
  const distanceShopToDropoff = haversineDistanceKm(shop, dropoff);
  const totalDistance = Number((distancePickupToShop + distanceShopToDropoff).toFixed(2));
  const quote = estimateFeeAndEta(totalDistance);

  return {
    pickup,
    dropoff,
    shop,
    distanceKm: totalDistance,
    fee: quote.fee,
    etaMin: quote.etaMin,
    etaMax: quote.etaMax,
  };
}
