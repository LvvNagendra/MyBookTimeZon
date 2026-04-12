/** Public salon detail URL — matches backend `GET /api/v1/public/{businessType}/{slug}`. */
export function salonDetailPath(slug: string, businessType = "SALON") {
  return `/salon/${encodeURIComponent(slug)}?businessType=${encodeURIComponent(businessType)}`;
}
