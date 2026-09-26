/**
 * Shared helpers for map pins (Super Admin create tenant + Tenant settings).
 */

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  provider: string;
};

export function parseCoordPair(
  latStr: string,
  lngStr: string,
): { ok: true; latitude: number | null; longitude: number | null } | { ok: false; error: string } {
  const latT = latStr.trim();
  const lngT = lngStr.trim();
  if (!latT && !lngT) return { ok: true, latitude: null, longitude: null };
  if (!latT || !lngT) return { ok: false, error: "Provide both latitude and longitude, or leave both empty." };
  const latitude = Number(latT);
  const longitude = Number(lngT);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { ok: false, error: "Latitude must be a number between -90 and 90." };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { ok: false, error: "Longitude must be a number between -180 and 180." };
  }
  return { ok: true, latitude, longitude };
}
