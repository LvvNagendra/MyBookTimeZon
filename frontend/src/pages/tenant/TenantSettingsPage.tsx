import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiUpdateClinic } from "../../api/client";
import { GoogleMapEmbed } from "../../components/GoogleMapEmbed";
import { buildLocationAddressQuery } from "../../utils/googleMapsEmbed";
import { useAuth } from "../../context/AuthContext";

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
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
  }, [c]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!token || !clinicId) return;
    setErr(null);
    const lat = latStr.trim() === "" ? null : Number(latStr);
    const lng = lngStr.trim() === "" ? null : Number(lngStr);
    if (lat != null && latStr.trim() !== "" && !Number.isFinite(lat)) {
      setErr("Latitude must be a number.");
      return;
    }
    if (lng != null && lngStr.trim() !== "" && !Number.isFinite(lng)) {
      setErr("Longitude must be a number.");
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
        latitude: lat != null && Number.isFinite(lat) ? lat : null,
        longitude: lng != null && Number.isFinite(lng) ? lng : null,
      });
      await refreshProfile();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  const mapQuery = buildLocationAddressQuery({
    address,
    village,
    displayLocation,
    city,
    state,
    country,
  });
  const latNum = latStr.trim() === "" ? null : Number(latStr);
  const lngNum = lngStr.trim() === "" ? null : Number(lngStr);
  const mapLat =
    latNum != null && lngNum != null && Number.isFinite(latNum) && Number.isFinite(lngNum) ? latNum : null;
  const mapLng =
    latNum != null && lngNum != null && Number.isFinite(latNum) && Number.isFinite(lngNum) ? lngNum : null;

  if (loading && !profile) return <main className="section hub-page"><p className="text-muted">Loading…</p></main>;

  return (
    <main id="main" className="section hub-page">
      <p className="text-muted">
        <Link to="/dashboard">Overview</Link>
      </p>
      <h1 className="page-title">Business settings</h1>
      <p className="page-subtitle">Address and map pin are shown on your public salon page and in discovery.</p>
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
          <label htmlFor="slug">Booking slug</label>
          <input id="slug" value={c?.slug ?? ""} readOnly />
          <p className="hint">Customers use /book/{c?.businessType ?? "SALON"}/{c?.slug ?? "your-slug"}</p>
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
          <label htmlFor="lat">Latitude (optional)</label>
          <input id="lat" inputMode="decimal" value={latStr} onChange={(e) => setLatStr(e.target.value)} placeholder="12.97…" />
        </div>
        <div className="field">
          <label htmlFor="lng">Longitude (optional)</label>
          <input id="lng" inputMode="decimal" value={lngStr} onChange={(e) => setLngStr(e.target.value)} placeholder="77.59…" />
        </div>
        <p className="text-muted small">
          Pick coordinates from Google Maps (right-click → coordinates) or leave blank to use address text only.
          Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env</code> for the official Maps Embed API.
        </p>

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
