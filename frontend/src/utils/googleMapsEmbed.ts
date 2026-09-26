/**
 * Builds a Google Maps iframe `src`. Prefer setting {@link VITE_GOOGLE_MAPS_API_KEY} and enabling
 * "Maps Embed API" in Google Cloud — then use the official embed URL.
 * Without a key, falls back to `maps?q=…&output=embed` (works for many regions; Google may show consent).
 */

export function buildGoogleMapsEmbedSrc(opts: {
  latitude?: number | null;
  longitude?: number | null;
  /** Used when lat/lng are not set — full address or area text */
  addressQuery?: string | null;
}): string | null {
  const key = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();
  const lat = opts.latitude;
  const lng = opts.longitude;
  let q: string;
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    q = `${lat},${lng}`;
  } else {
    q = (opts.addressQuery ?? "").trim();
  }
  if (!q) return null;

  if (key) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&zoom=16&maptype=roadmap`;
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

export function buildLocationAddressQuery(parts: {
  address?: string | null;
  village?: string | null;
  displayLocation?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}): string {
  return [parts.address, parts.village, parts.displayLocation, parts.city, parts.state, parts.country]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(", ");
}
