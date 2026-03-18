export type Coordinates = { lat: number; lng: number };

export type AddressSuggestion = {
  label: string;
  placeName: string;
  lat: number;
  lng: number;
};

type NominatimSearchItem = {
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
};

type NominatimReverseResponse = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

type SuggestAddressOptions = {
  proximity?: Coordinates | null;
  countryCodes?: string[];
  limit?: number;
};

const NOMINATIM_BASE_URL = process.env.OSM_NOMINATIM_BASE_URL?.trim() || "https://nominatim.openstreetmap.org";
const REQUEST_TIMEOUT_MS = 5000;

function toNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCountryCodes(countryCodes?: string[]): string {
  const safeCodes = (countryCodes ?? [])
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length === 2);
  return safeCodes.join(",");
}

function haversineDistanceKm(from: Coordinates, to: Coordinates): number {
  const earthRadius = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const deltaLat = toRad(to.lat - from.lat);
  const deltaLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Accept-Language": "en,fil",
        "User-Agent": "TapWash/1.0 (+https://tapwash.app)",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function suggestAddresses(query: string, options?: SuggestAddressOptions): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: "jsonv2",
    addressdetails: "1",
    dedupe: "1",
    limit: String(options?.limit ?? 5),
  });

  const countryCodes = normalizeCountryCodes(options?.countryCodes);
  if (countryCodes) {
    params.set("countrycodes", countryCodes);
  }

  const endpoint = `${NOMINATIM_BASE_URL}/search?${params.toString()}`;

  try {
    const response = await fetchWithTimeout(endpoint);
    if (!response.ok) return [];

    const body = (await response.json()) as NominatimSearchItem[];
    const suggestions = body
      .map((item) => {
        const lat = toNumber(item.lat);
        const lng = toNumber(item.lon);
        const placeName = item.display_name?.trim();
        if (lat === null || lng === null || !placeName) return null;

        return {
          label: item.name?.trim() || placeName,
          placeName,
          lat,
          lng,
        } satisfies AddressSuggestion;
      })
      .filter((item): item is AddressSuggestion => Boolean(item));

    if (options?.proximity) {
      const proximity = options.proximity;
      suggestions.sort(
        (a, b) =>
          haversineDistanceKm(proximity, { lat: a.lat, lng: a.lng }) -
          haversineDistanceKm(proximity, { lat: b.lat, lng: b.lng }),
      );
    }

    return suggestions;
  } catch {
    return [];
  }
}

export async function geocodeAddress(address: string, countryCodes: string[] = ["ph"]): Promise<Coordinates | null> {
  const trimmed = address.trim();
  if (trimmed.length < 3) return null;

  const suggestions = await suggestAddresses(trimmed, {
    countryCodes,
    limit: 1,
  });

  if (suggestions.length === 0) return null;
  return {
    lat: suggestions[0].lat,
    lng: suggestions[0].lng,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string; coordinates: Coordinates } | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    zoom: "18",
    addressdetails: "1",
  });

  const endpoint = `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`;

  try {
    const response = await fetchWithTimeout(endpoint);
    if (!response.ok) return null;

    const body = (await response.json()) as NominatimReverseResponse;
    const resolvedLat = toNumber(body.lat) ?? lat;
    const resolvedLng = toNumber(body.lon) ?? lng;
    const placeName = body.display_name?.trim();

    if (!placeName) return null;

    return {
      address: placeName,
      coordinates: {
        lat: resolvedLat,
        lng: resolvedLng,
      },
    };
  } catch {
    return null;
  }
}