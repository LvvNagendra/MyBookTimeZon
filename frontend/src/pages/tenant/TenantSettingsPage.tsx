import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGeocodeResolve, apiUpdateClinic } from "../../api/client";
import { GoogleMapEmbed } from "../../components/GoogleMapEmbed";
import { buildLocationAddressQuery } from "../../utils/googleMapsEmbed";
import { parseCoordPair } from "../../utils/mapPin";
import { useAuth } from "../../context/AuthContext";
import { compressImageFileToDataUrl } from "../../utils/imageCompress";
import {
  WEEKDAY_KEYS,
  WEEKDAY_LABELS,
  dayRange,
  parseWeeklyHours,
  serializeWeeklyHours,
  setDayRange,
  type WeekdayKey,
  type WeeklyHours,
} from "../../utils/workingHours";

export default function TenantSettingsPage() {
  const { token, profile, loading, refreshProfile } = useAuth();
  const c = profile?.clinic;
  const clinicId = c?.id ?? null;

  const [bizName, setBizName] = useState("");
  const [address, setAddress] = useState("");
  const [displayLocation, setDisplayLocation] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [village, setVillage] = useState("");
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");
  const [weekly, setWeekly] = useState<WeeklyHours>(() => parseWeeklyHours(null));
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoHint, setGeoHint] = useState<string | null>(null);

  useEffect(() => {
    if (!c) return;
    setBizName(c.businessName ?? "");
    setAddress(c.address ?? "");
    setDisplayLocation(c.displayLocation ?? "");
    setCity(c.city ?? "");
    setState(c.state ?? "");
    setCountry(c.country ?? "");
    setVillage(c.village ?? "");
    setLatStr(c.latitude != null ? String(c.latitude) : "");
    setLngStr(c.longitude != null ? String(c.longitude) : "");
    setWeekly(parseWeeklyHours(c.workingHoursJson ?? null));
    setLogoUrl(c.logoUrl ?? null);
  }, [c]);

  function patchDay(day: WeekdayKey, patch: Partial<{ open: boolean; start: string; end: string }>) {
    const cur = dayRange(weekly, day);
    setWeekly(
      setDayRange(weekly, day, patch.open ?? cur.open, patch.start ?? cur.start, patch.end ?? cur.end),
    );
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!token || !clinicId) return;
    setErr(null);
    const coords = parseCoordPair(latStr, lngStr);
    if (!coords.ok) {
      setErr(coords.error);
      return;
    }
    try {
      await apiUpdateClinic(token, clinicId, {
        businessName: bizName.trim(),
        address: address.trim() || null,
        displayLocation: displayLocation.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        country: country.trim() || null,
        village: village.trim() || null,
        latitude: coords.latitude,
        longitude: coords.longitude,
        workingHoursJson: serializeWeeklyHours(weekly, "Business default hours"),
        logoUrl: logoUrl,
      });
      await refreshProfile();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  const mapQuery = useMemo(
    () =>
      buildLocationAddressQuery({
        address,
        village,
        displayLocation,
        city,
        state,
        country,
      }),
    [address, village, displayLocation, city, state, country],
  );
  const latNum = latStr.trim() === "" ? null : Number(latStr);
  const lngNum = lngStr.trim() === "" ? null : Number(lngStr);
  const mapLat =
    latNum != null && lngNum != null && Number.isFinite(latNum) && Number.isFinite(lngNum) ? latNum : null;
  const mapLng =
    latNum != null && lngNum != null && Number.isFinite(latNum) && Number.isFinite(lngNum) ? lngNum : null;

  async function pinFromGoogle() {
    if (!token) return;
    const q = mapQuery.trim();
    if (!q) {
      setErr("Enter street / area / city first, then pin from Google.");
      return;
    }
    setGeoBusy(true);
    setErr(null);
    setGeoHint(null);
    try {
      const res = await apiGeocodeResolve(token, q);
      setLatStr(String(res.latitude));
      setLngStr(String(res.longitude));
      setGeoHint(
        res.provider === "GOOGLE"
          ? `Pinned via Google: ${res.formattedAddress}`
          : `Pinned via ${res.provider} — set GOOGLE_MAPS_API_KEY on the API for Google-accurate results.`,
      );
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Geocode failed");
    } finally {
      setGeoBusy(false);
    }
  }

  if (loading && !profile)
    return (
      <main className="section hub-page">
        <p className="text-muted">Loading…</p>
      </main>
    );

  const hoursLabel = c?.businessType === "CLINIC" ? "Clinic open hours" : "Shop open hours";

  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/dashboard">Overview</Link>
      </p>
      <h1 className="page-title">Business settings</h1>
      <p className="page-subtitle">
        Address, map pin, and default hours. Staff/doctor hours override these for booking slots when set.
      </p>
      {err && (
        <div className="alert alert--error" role="alert">
          {err}
        </div>
      )}

      <form className="surface-card glass-card" onSubmit={onSave}>
        <h2 className="section-heading">Public profile</h2>
        <div className="field">
          <label htmlFor="bn">Business name</label>
          <input id="bn" value={bizName} onChange={(e) => setBizName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="logo">Business logo</label>
          {logoUrl ? (
            <div style={{ marginBottom: "0.5rem" }}>
              <img src={logoUrl} alt="" width={72} height={72} style={{ objectFit: "cover", borderRadius: 12 }} />
            </div>
          ) : null}
          <input
            id="logo"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              void compressImageFileToDataUrl(f, { maxWidth: 512, quality: 0.85 }).then((url) => {
                if (!url) setErr("Logo too large — try a smaller image.");
                else {
                  setErr(null);
                  setLogoUrl(url);
                }
              });
            }}
          />
          <p className="hint">Shown on your public booking page. Optional HTTPS URL also works if you paste later.</p>
          {logoUrl ? (
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setLogoUrl(null)}>
              Remove logo
            </button>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor="slug">Booking slug</label>
          <input id="slug" value={c?.slug ?? ""} readOnly />
          <p className="hint">
            Customers use /book/{c?.businessType ?? "SALON"}/{c?.slug ?? "your-slug"}
          </p>
        </div>
        <div className="field">
          <label htmlFor="addr">Street address</label>
          <input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Building, street" />
        </div>
        <div className="field">
          <label htmlFor="dl">Area label</label>
          <input
            id="dl"
            value={displayLocation}
            onChange={(e) => setDisplayLocation(e.target.value)}
            placeholder="e.g. Indiranagar, Bengaluru"
          />
        </div>
        <div className="field">
          <label htmlFor="vill">Village / locality</label>
          <input id="vill" value={village} onChange={(e) => setVillage(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="st">State</label>
          <input id="st" value={state} onChange={(e) => setState(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="ctry">Country</label>
          <input id="ctry" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lat">Latitude</label>
          <input id="lat" inputMode="decimal" value={latStr} onChange={(e) => setLatStr(e.target.value)} placeholder="12.97…" />
        </div>
        <div className="field">
          <label htmlFor="lng">Longitude</label>
          <input id="lng" inputMode="decimal" value={lngStr} onChange={(e) => setLngStr(e.target.value)} placeholder="77.59…" />
        </div>
        <div className="field" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <button type="button" className="btn btn--ghost btn--small" disabled={geoBusy || !token} onClick={() => void pinFromGoogle()}>
            {geoBusy ? "Pinning…" : "Pin from address (Google)"}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => {
              setLatStr("");
              setLngStr("");
              setGeoHint(null);
            }}
          >
            Clear pin
          </button>
        </div>
        {geoHint ? (
          <p className="text-muted small" role="status">
            {geoHint}
          </p>
        ) : (
          <p className="hint">
            Required for customer “near me” and an accurate map. Use the pin button after filling address fields, or paste
            coords from Google Maps.
          </p>
        )}

        <h2 className="section-heading">{hoursLabel}</h2>
        <p className="text-muted small">Used when a staff member has no personal schedule yet.</p>
        <div className="avail-grid">
          {WEEKDAY_KEYS.map((day) => {
            const r = dayRange(weekly, day);
            return (
              <label key={day} className="avail-row">
                <span className="avail-day">{WEEKDAY_LABELS[day]}</span>
                <input
                  type="time"
                  className="avail-time"
                  value={r.start}
                  disabled={!r.open}
                  onChange={(e) => patchDay(day, { start: e.target.value })}
                />
                <span>–</span>
                <input
                  type="time"
                  className="avail-time"
                  value={r.end}
                  disabled={!r.open}
                  onChange={(e) => patchDay(day, { end: e.target.value })}
                />
                <input
                  type="checkbox"
                  checked={r.open}
                  onChange={(e) => patchDay(day, { open: e.target.checked })}
                  aria-label={`${WEEKDAY_LABELS[day]} open`}
                />
              </label>
            );
          })}
        </div>

        <h2 className="section-heading">Map preview</h2>
        <div className="surface-card tenant-settings-map" style={{ padding: 0, overflow: "hidden" }}>
          <GoogleMapEmbed
            latitude={mapLat}
            longitude={mapLng}
            addressQuery={mapQuery || undefined}
            height="260px"
          />
        </div>

        <button type="submit" className="btn btn--gradient btn--wide" style={{ marginTop: "1rem" }} disabled={!token || !clinicId}>
          Save to server
        </button>
        {saved && (
          <p className="alert alert--success" role="status" style={{ marginTop: "1rem" }}>
            Saved.
          </p>
        )}
      </form>
    </main>
  );
}
