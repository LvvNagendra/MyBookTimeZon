import { buildGoogleMapsEmbedSrc } from "../utils/googleMapsEmbed";

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  addressQuery?: string | null;
  /** Shown under the map or when no location */
  caption?: string;
  className?: string;
  /** CSS height for the iframe area, e.g. 280 or "min(50vh, 360px)" */
  height?: string;
};

/**
 * Embeds Google Maps for a clinic location (coordinates preferred, else address search).
 */
export function GoogleMapEmbed({
  latitude,
  longitude,
  addressQuery,
  caption,
  className = "",
  height = "min(52vh, 360px)",
}: Props) {
  const src = buildGoogleMapsEmbedSrc({ latitude, longitude, addressQuery });
  if (!src) {
    return (
      <div className={`google-map-fallback surface-card ${className}`.trim()}>
        <p className="text-muted small">Add an address or map pin in business settings to show the map.</p>
        {caption ? <p className="text-muted small">{caption}</p> : null}
      </div>
    );
  }

  return (
    <div className={`google-map-embed ${className}`.trim()}>
      <iframe
        title="Google Map"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        src={src}
        style={{ width: "100%", height, border: 0, borderRadius: "inherit" }}
      />
      {caption ? (
        <p className="text-muted small google-map-embed__caption" style={{ marginTop: "0.65rem" }}>
          {caption}
        </p>
      ) : null}
    </div>
  );
}
