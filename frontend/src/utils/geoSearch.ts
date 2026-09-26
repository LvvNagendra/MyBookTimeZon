/** Helpers for cascading country → state → city → village filters on demo salon data. */

export type GeoFilterState = {
  country: string;
  state: string;
  city: string;
  village: string;
  q: string;
};

export type SalonGeoFields = {
  country: string;
  state: string;
  city: string;
  village: string;
  displayLocation: string;
  name: string;
  address: string;
  tags: readonly string[];
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter((v) => v != null && String(v).trim() !== ""))]
    .sort((a, b) => a.localeCompare(b));
}

export function getCountries<T extends SalonGeoFields>(salons: readonly T[]): string[] {
  return uniqueSorted(salons.map((s) => s.country));
}

export function getStatesForCountry<T extends SalonGeoFields>(salons: readonly T[], country: string): string[] {
  const pool = country ? salons.filter((s) => s.country === country) : [...salons];
  return uniqueSorted(pool.map((s) => s.state));
}

export function getCitiesFor<T extends SalonGeoFields>(
  salons: readonly T[],
  country: string,
  state: string
): string[] {
  let pool = [...salons];
  if (country) pool = pool.filter((s) => s.country === country);
  if (state) pool = pool.filter((s) => s.state === state);
  return uniqueSorted(pool.map((s) => s.city));
}

export function getVillagesFor<T extends SalonGeoFields>(
  salons: readonly T[],
  country: string,
  state: string,
  city: string
): string[] {
  let pool = [...salons];
  if (country) pool = pool.filter((s) => s.country === country);
  if (state) pool = pool.filter((s) => s.state === state);
  if (city) pool = pool.filter((s) => s.city === city);
  return uniqueSorted(pool.map((s) => s.village));
}

export function filterSalonsByGeo<T extends SalonGeoFields>(salons: readonly T[], f: GeoFilterState): T[] {
  const q = f.q.trim().toLowerCase();
  return salons.filter((s) => {
    if (f.country && s.country !== f.country) return false;
    if (f.state && s.state !== f.state) return false;
    if (f.city && s.city !== f.city) return false;
    if (f.village && s.village !== f.village) return false;
    if (q) {
      const hay = [
        s.name,
        s.address,
        s.displayLocation,
        s.country,
        s.state,
        s.city,
        s.village,
        ...s.tags,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
