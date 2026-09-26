/** Strip non-digits; remove leading 91 for India. */
export function normalizeInMobile(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.length >= 12 && d.startsWith("91")) d = d.slice(2);
  return d;
}

/** 10-digit Indian mobile starting with 6–9. */
export function isValidInMobile(input: string): boolean {
  const d = normalizeInMobile(input);
  return d.length === 10 && /^[6-9]\d{9}$/.test(d);
}

export function formatInMobileDisplay(input: string): string {
  const d = normalizeInMobile(input);
  if (d.length !== 10) return input.trim();
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

export function maskMobileLast4(input: string): string {
  const d = normalizeInMobile(input);
  if (d.length < 4) return "••••";
  return `+91 •••••• ${d.slice(-4)}`;
}
