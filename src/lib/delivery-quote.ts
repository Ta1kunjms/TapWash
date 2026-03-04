export type Coordinates = { lat: number; lng: number };

export type AddressSuggestion = {
  label: string;
  placeName: string;
  lat: number;
  lng: number;
};

function hashToRange(seed: string, min: number, max: number) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 100000) / 100000;
  return min + (max - min) * normalized;
}

async function geocodeWithMapbox(query: string): Promise<Coordinates | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) return null;

  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?limit=1&access_token=${token}`;
  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) return null;

  const body = (await response.json()) as {
    features?: Array<{ center?: [number, number] }>;
  };

  const center = body.features?.[0]?.center;
  if (!center) return null;

  return { lng: center[0], lat: center[1] };
}

export async function suggestAddresses(query: string): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (token) {
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?limit=5&types=address,place,locality,neighborhood&access_token=${token}`;
    const response = await fetch(endpoint, { cache: "no-store" });
    if (response.ok) {
      const body = (await response.json()) as {
        features?: Array<{
          text?: string;
          place_name?: string;
          center?: [number, number];
        }>;
      };

      const suggestions = (body.features ?? [])
        .map((feature) => {
          const center = feature.center;
          if (!center || !feature.place_name) return null;
          return {
            label: feature.text ?? feature.place_name,
            placeName: feature.place_name,
            lat: center[1],
            lng: center[0],
          } satisfies AddressSuggestion;
        })
        .filter((item): item is AddressSuggestion => Boolean(item));

      if (suggestions.length > 0) return suggestions;
    }
  }

  return [0, 1, 2].map((index) => {
    const suffix = ["Street", "Avenue", "Barangay"][index] ?? "Street";
    const seed = `${trimmed}-${index}`;
    return {
      label: `${trimmed} ${suffix}`,
      placeName: `${trimmed} ${suffix}, Metro Manila`,
      lat: hashToRange(`${seed}-lat`, 14.2, 14.95),
      lng: hashToRange(`${seed}-lng`, 120.8, 121.2),
    } satisfies AddressSuggestion;
  });
}

export async function geocodeAddress(address: string): Promise<Coordinates> {
  const trimmed = address.trim();
  const fromMapbox = await geocodeWithMapbox(trimmed);
  if (fromMapbox) return fromMapbox;

  const lat = hashToRange(trimmed, 14.2, 14.95);
  const lng = hashToRange(`${trimmed}-lng`, 120.8, 121.2);
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

export async function getDeliveryQuote(input: {
  pickupAddress: string;
  dropoffAddress: string;
  shopLocation: string;
}) {
  const [pickup, dropoff, shop] = await Promise.all([
    geocodeAddress(input.pickupAddress),
    geocodeAddress(input.dropoffAddress),
    geocodeAddress(input.shopLocation),
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
