import { useId } from "react";

type BrandLogoProps = {
  /** Compact mark-only (nav / splash) */
  markOnly?: boolean;
  /** Larger splash treatment */
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * SlotNexa wordmark — calendar-slot mark + clean type.
 * Use across header, splash, and marketing hero.
 */
export function BrandLogo({ markOnly = false, size = "md", className = "" }: BrandLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `sn-grad-${uid}`;
  const dim = size === "lg" ? 56 : size === "sm" ? 32 : 40;
  return (
    <span className={`brand-logo brand-logo--${size} ${className}`.trim()}>
      <svg
        className="brand-logo__mark"
        width={dim}
        height={dim}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect width="48" height="48" rx="14" fill={`url(#${gradId})`} />
        <rect x="11" y="14" width="26" height="22" rx="4" stroke="#fff" strokeWidth="2.2" fill="none" />
        <path d="M11 20.5h26" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M18 11v6M30 11v6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <rect x="15" y="24" width="7" height="5.5" rx="1.2" fill="#fff" opacity="0.35" />
        <rect x="24.5" y="24" width="7" height="5.5" rx="1.2" fill="#fff" />
        <rect x="15" y="31.5" width="7" height="5.5" rx="1.2" fill="#fff" opacity="0.35" />
        <rect x="24.5" y="31.5" width="7" height="5.5" rx="1.2" fill="#fff" opacity="0.55" />
        <defs>
          <linearGradient id={gradId} x1="8" y1="4" x2="44" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E8C547" />
            <stop offset="0.55" stopColor="#C9A227" />
            <stop offset="1" stopColor="#1A3A4A" />
          </linearGradient>
        </defs>
      </svg>
      {!markOnly ? (
        <span className="brand-logo__word">
          Slot<span className="brand-logo__accent">Nexa</span>
        </span>
      ) : null}
    </span>
  );
}

export const BRAND_NAME = "SlotNexa";
export const BRAND_TAGLINE = "Book the next open slot — salons & clinics";
export const BRAND_STORAGE = {
  sector: "slotnexa_preferred_sector",
  intro: "slotnexa_intro_done",
  theme: "slotnexa_theme",
  booking: "slotnexa_last_booking",
  /** Legacy SalonGo keys — still read once for smooth upgrade */
  legacySector: "salongo_preferred_sector",
  legacyIntro: "salongo_intro_done",
  legacyTheme: "salongo_theme",
  legacyBooking: "salongo_last_booking",
} as const;

export function readStorageKey(primary: string, legacy: string): string | null {
  try {
    return localStorage.getItem(primary) ?? localStorage.getItem(legacy);
  } catch {
    return null;
  }
}
