import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  apiAdminCreateTenant,
  apiAdminSetSuspended,
  apiAdminTenantSnapshot,
  apiAdminTenants,
  apiBusinessTypes,
  apiGeocodeResolve,
  apiMetaStaffProfileOptions,
  apiMetaStarterServiceTemplates,
  type AdminTenantSnapshot,
  type BusinessTypeOption,
  type ClinicRow,
  type StarterServiceTemplate,
} from "../../api/client";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminAlert, AdminPanel, AdminStatusBadge } from "../../components/admin/AdminUi";
import { GoogleMapEmbed } from "../../components/GoogleMapEmbed";
import { PasswordField } from "../../components/PasswordField";
import { useAuth } from "../../context/AuthContext";
import { buildLocationAddressQuery } from "../../utils/googleMapsEmbed";
import { parseCoordPair } from "../../utils/mapPin";
import { formatInMobileDisplay } from "../../utils/phone";

function displayPhone(p: string | null | undefined): string {
  if (!p) return "—";
  const digits = p.replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${formatInMobileDisplay(digits)}`;
  return p;
}

const STAFF_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function staffAvailabilityTemplate(): string {
  const weekly: Record<string, string[]> = {};
  for (const d of STAFF_DAYS) weekly[d] = d === "sun" ? [] : ["09:00-18:00"];
  return JSON.stringify({ weekly, note: "Tenant refines under Staff → weekly JSON." }, null, 2);
}

export default function AdminTenantsPage() {
  const { token } = useAuth();
  const [tenants, setTenants] = useState<ClinicRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [bizName, setBizName] = useState("");
  const [slug, setSlug] = useState("");
  const [bizType, setBizType] = useState("SALON");
  const [bizTypes, setBizTypes] = useState<BusinessTypeOption[]>([]);
  const [starterTemplates, setStarterTemplates] = useState<StarterServiceTemplate[]>([]);
  const [city, setCity] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [salonPhone, setSalonPhone] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [village, setVillage] = useState("");
  const [displayLocation, setDisplayLocation] = useState("");
  const [address, setAddress] = useState("");
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoHint, setGeoHint] = useState<string | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [addFirstStylist, setAddFirstStylist] = useState(false);
  const [initStaffName, setInitStaffName] = useState("");
  const [initStaffSpec, setInitStaffSpec] = useState("");
  const [initStaffEmail, setInitStaffEmail] = useState("");
  const [initStaffMobile, setInitStaffMobile] = useState("");
  const [initStaffGender, setInitStaffGender] = useState("UNSPECIFIED");
  const [initStaffParallel, setInitStaffParallel] = useState(1);
  const [initStaffHours, setInitStaffHours] = useState(staffAvailabilityTemplate);
  const [snapshot, setSnapshot] = useState<AdminTenantSnapshot | null>(null);
  const [snapshotBusy, setSnapshotBusy] = useState(false);
  const [genderOptions, setGenderOptions] = useState<string[]>([
    "UNSPECIFIED",
    "FEMALE",
    "MALE",
    "NON_BINARY",
    "PREFER_NOT_TO_SAY",
  ]);

  type SvcRow = { name: string; category: string; duration: string; priceInr: string };
  const [starterServices, setStarterServices] = useState<SvcRow[]>([
    { name: "", category: "", duration: "45", priceInr: "" },
    { name: "", category: "", duration: "60", priceInr: "" },
    { name: "", category: "", duration: "30", priceInr: "" },
  ]);

  const load = useCallback(async () => {
    if (!token) return;
    setErr(null);
    try {
      const t = await apiAdminTenants(token);
      setTenants(t);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void apiMetaStaffProfileOptions()
      .then((m) => {
        if (m.genders.length) setGenderOptions(m.genders);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    void apiBusinessTypes()
      .then((t) => setBizTypes(t))
      .catch(() => setBizTypes([]));
  }, []);

  useEffect(() => {
    void apiMetaStarterServiceTemplates(bizType)
      .then(setStarterTemplates)
      .catch(() => setStarterTemplates([]));
  }, [bizType]);

  function fillNextEmptyStarterRow(t: StarterServiceTemplate) {
    setStarterServices((prev) => {
      const next = [...prev];
      const inr = (t.priceCents / 100).toString();
      const idx = next.findIndex((r) => !r.name.trim());
      if (idx >= 0) {
        next[idx] = {
          name: t.name,
          category: t.category ?? "",
          duration: String(t.durationMinutes),
          priceInr: inr,
        };
        return next;
      }
      next.push({
        name: t.name,
        category: t.category ?? "",
        duration: String(t.durationMinutes),
        priceInr: inr,
      });
      return next.slice(0, 8);
    });
  }

  async function toggleSuspend(c: ClinicRow) {
    if (!token) return;
    try {
      await apiAdminSetSuspended(token, c.id, !c.tenantSuspended);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function openSnapshot(c: ClinicRow) {
    if (!token) return;
    setSnapshotBusy(true);
    setErr(null);
    try {
      setSnapshot(await apiAdminTenantSnapshot(token, c.id));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Snapshot failed");
    } finally {
      setSnapshotBusy(false);
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

  const mapLat = useMemo(() => {
    const n = Number(latStr);
    return latStr.trim() && Number.isFinite(n) ? n : null;
  }, [latStr]);
  const mapLng = useMemo(() => {
    const n = Number(lngStr);
    return lngStr.trim() && Number.isFinite(n) ? n : null;
  }, [lngStr]);

  async function pinFromGoogle() {
    if (!token) return;
    const q = mapQuery.trim();
    if (!q) {
      setErr("Enter country / state / city / area (or street address) before pinning.");
      return;
    }
    setGeoBusy(true);
    setErr(null);
    setGeoHint(null);
    try {
      const res = await apiGeocodeResolve(token, q);
      setLatStr(String(res.latitude));
      setLngStr(String(res.longitude));
      if (!displayLocation.trim() && res.formattedAddress) {
        setDisplayLocation(res.formattedAddress.split(",").slice(0, 2).join(",").trim());
      }
      setGeoHint(
        res.provider === "GOOGLE"
          ? `Pinned via Google: ${res.formattedAddress}`
          : `Pinned via ${res.provider} (set GOOGLE_MAPS_API_KEY on the API for Google-accurate results): ${res.formattedAddress}`,
      );
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Geocode failed");
    } finally {
      setGeoBusy(false);
    }
  }

  async function addTenant(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (addFirstStylist && !initStaffName.trim()) {
      setErr("Enter a display name for the first stylist, or turn off “Add first stylist”.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const coords = parseCoordPair(latStr, lngStr);
      if (!coords.ok) {
        setErr(coords.error);
        setSaving(false);
        return;
      }
      const initialStaff =
        addFirstStylist && initStaffName.trim()
          ? {
              displayName: initStaffName.trim(),
              specialization: initStaffSpec.trim() || undefined,
              email: initStaffEmail.trim() || undefined,
              mobile: initStaffMobile.trim() || undefined,
              gender: initStaffGender || undefined,
              parallelBookingsMax: Math.min(50, Math.max(1, initStaffParallel)),
              workingHoursJson: initStaffHours.trim() || undefined,
            }
          : undefined;

      const initialServices = starterServices
        .filter((r) => r.name.trim())
        .map((r) => {
          const dm = Math.min(480, Math.max(5, parseInt(r.duration, 10) || 45));
          const inr = parseFloat(r.priceInr.replace(/,/g, "")) || 0;
          const priceCents = Math.round(Math.min(500000, Math.max(0, inr)) * 100);
          return {
            name: r.name.trim(),
            category: r.category.trim() || null,
            durationMinutes: dm,
            priceCents,
          };
        });

      await apiAdminCreateTenant(token, {
        businessName: bizName.trim(),
        slug: slug.trim(),
        businessType: bizType,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        state: state.trim() || undefined,
        village: village.trim() || undefined,
        displayLocation: displayLocation.trim() || undefined,
        specialties: specialties.trim() || undefined,
        salonPhone,
        ownerMobile,
        ownerEmail: ownerEmail.trim(),
        ownerPassword,
        internalNotes: internalNotes.trim() || undefined,
        latitude: coords.latitude,
        longitude: coords.longitude,
        initialStaff,
        initialServices: initialServices.length ? initialServices : undefined,
      });
      setBizName("");
      setSlug("");
      setCity("");
      setSpecialties("");
      setSalonPhone("");
      setOwnerMobile("");
      setOwnerEmail("");
      setOwnerPassword("");
      setCountry("");
      setState("");
      setVillage("");
      setDisplayLocation("");
      setAddress("");
      setLatStr("");
      setLngStr("");
      setGeoHint(null);
      setInternalNotes("");
      setAddFirstStylist(false);
      setInitStaffName("");
      setInitStaffSpec("");
      setInitStaffEmail("");
      setInitStaffMobile("");
      setInitStaffGender("UNSPECIFIED");
      setInitStaffParallel(1);
      setInitStaffHours(staffAvailabilityTemplate());
      setStarterServices([
        { name: "", category: "", duration: "45", priceInr: "" },
        { name: "", category: "", duration: "60", priceInr: "" },
        { name: "", category: "", duration: "30", priceInr: "" },
      ]);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not add tenant");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main id="main" className="sa-page">
      <AdminPageHeader
        title="Tenants"
        subtitle="Provision each salon or clinic with business type, specialties, location, and owner access. Starter staff and services stay scoped to that tenant only."
      />
      {err && <AdminAlert>{err}</AdminAlert>}

      <AdminPanel
        title="Add tenant"
        subtitle="Owner mobile for alerts · salon phone on the public page · starter catalogue rows are created only for this tenant"
      >
        <form onSubmit={(e) => void addTenant(e)} className="admin-add-tenant__form admin-add-tenant__form--wide">
          <div className="admin-add-tenant__grid">
            <div className="field">
              <label htmlFor="add-biz">Business name *</label>
              <input
                id="add-biz"
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                required
                placeholder="e.g. Radiance Studio"
                autoComplete="organization"
              />
            </div>
            <div className="field">
              <label htmlFor="add-slug">Booking slug *</label>
              <input
                id="add-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())}
                required
                placeholder="radiance-studio"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              />
            </div>
            <div className="field">
              <label htmlFor="add-type">Business type *</label>
              <select id="add-type" value={bizType} onChange={(e) => setBizType(e.target.value)}>
                {(bizTypes.length ? bizTypes : [{ code: "SALON", label: "Salon" }]).map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.label}
                  </option>
                ))}
              </select>
              <p className="hint">Options load from <code>/api/v1/meta/business-types</code> (platform catalog, not tenant data).</p>
            </div>
            <div className="field">
              <label htmlFor="add-country">Country</label>
              <input
                id="add-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. India"
                autoComplete="country"
              />
            </div>
            <div className="field">
              <label htmlFor="add-state">State / region</label>
              <input
                id="add-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Karnataka"
                autoComplete="address-level1"
              />
            </div>
            <div className="field">
              <label htmlFor="add-city">City / town</label>
              <input
                id="add-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                autoComplete="address-level2"
              />
            </div>
            <div className="field">
              <label htmlFor="add-village">Area / village</label>
              <input
                id="add-village"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="e.g. Indiranagar"
              />
            </div>
            <div className="field field--full">
              <label htmlFor="add-display-loc">Display location (optional)</label>
              <input
                id="add-display-loc"
                value={displayLocation}
                onChange={(e) => setDisplayLocation(e.target.value)}
                placeholder="e.g. Indiranagar, Bengaluru — shown on booking page"
              />
            </div>
            <div className="field field--full">
              <label htmlFor="add-address">Street address (optional)</label>
              <input
                id="add-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12 MG Road, near metro"
                autoComplete="street-address"
              />
            </div>
            <div className="field field--full admin-map-pin">
              <h3 className="section-heading" style={{ marginBottom: "0.35rem" }}>
                Google map pin
              </h3>
              <p className="hint" style={{ marginTop: 0 }}>
                Customers need latitude/longitude for “near me” distance and an accurate map. Fill address fields, then
                pin — or paste coordinates from Google Maps.
              </p>
              <div className="admin-add-tenant__grid" style={{ marginTop: "0.75rem" }}>
                <div className="field">
                  <label htmlFor="add-lat">Latitude</label>
                  <input
                    id="add-lat"
                    inputMode="decimal"
                    value={latStr}
                    onChange={(e) => setLatStr(e.target.value)}
                    placeholder="12.9784"
                  />
                </div>
                <div className="field">
                  <label htmlFor="add-lng">Longitude</label>
                  <input
                    id="add-lng"
                    inputMode="decimal"
                    value={lngStr}
                    onChange={(e) => setLngStr(e.target.value)}
                    placeholder="77.6408"
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
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
                <p className="text-muted small" style={{ marginTop: "0.5rem" }} role="status">
                  {geoHint}
                </p>
              ) : null}
              <div className="surface-card" style={{ marginTop: "0.75rem", padding: 0, overflow: "hidden" }}>
                <GoogleMapEmbed
                  latitude={mapLat != null && mapLng != null ? mapLat : null}
                  longitude={mapLat != null && mapLng != null ? mapLng : null}
                  addressQuery={mapQuery || undefined}
                  height="220px"
                />
              </div>
            </div>
            <div className="field field--full">
              <label htmlFor="add-spec">Specialties &amp; services focus</label>
              <textarea
                id="add-spec"
                rows={2}
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                placeholder="e.g. Haircut, skin fade, beard, hydra facial — comma-separated"
              />
              <p className="hint">What this salon is known for; used for discovery filters later.</p>
            </div>
            <div className="field">
              <label htmlFor="add-salon-phone">Salon phone * (customer-facing)</label>
              <input
                id="add-salon-phone"
                inputMode="numeric"
                value={salonPhone}
                onChange={(e) => setSalonPhone(e.target.value)}
                required
                placeholder="10-digit mobile"
                autoComplete="tel"
              />
              <p className="hint">Shown to customers for calls.</p>
            </div>
            <div className="field">
              <label htmlFor="add-owner-mob">Owner mobile * (alerts)</label>
              <input
                id="add-owner-mob"
                inputMode="numeric"
                value={ownerMobile}
                onChange={(e) => setOwnerMobile(e.target.value)}
                required
                placeholder="10-digit mobile"
                autoComplete="tel"
              />
              <p className="hint">Booking alerts, payout notices, OTP when SMS is live.</p>
            </div>
            <div className="field">
              <label htmlFor="add-owner">Owner email *</label>
              <input
                id="add-owner"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                required
                placeholder="owner@salon.com"
                autoComplete="email"
              />
            </div>
            <PasswordField
              id="add-owner-pw"
              label="Owner password *"
              value={ownerPassword}
              onChange={setOwnerPassword}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Min. 8 characters — tenant signs in with this"
              hint="Use Show to verify. Tenant Admin signs in with owner email + this password."
            />
            <div className="field field--full">
              <label htmlFor="add-notes">Internal notes (admin only)</label>
              <textarea
                id="add-notes"
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Contract tier, onboarding status…"
              />
            </div>
          </div>

          <div className="admin-add-tenant__grid admin-add-tenant__grid--wide" style={{ marginTop: "1.25rem" }}>
            <div className="field field--full">
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={addFirstStylist}
                  onChange={(e) => setAddFirstStylist(e.target.checked)}
                />{" "}
                Add first stylist for <em>this</em> tenant (name, contact, gender, capacity, weekly hours JSON)
              </label>
              <p className="hint">
                Gender options come from <code>/api/v1/meta/staff-profile-options</code>. Staff and service dropdowns in the tenant app
                are always loaded from <code>/clinics/{"{theirId}"}/staff</code> and <code>/services</code> — never another tenant’s data.
              </p>
            </div>
            {addFirstStylist && (
              <>
                <div className="field">
                  <label htmlFor="is-name">Stylist display name *</label>
                  <input
                    id="is-name"
                    value={initStaffName}
                    onChange={(e) => setInitStaffName(e.target.value)}
                    placeholder="e.g. Priya S"
                  />
                </div>
                <div className="field">
                  <label htmlFor="is-spec">Main specialty</label>
                  <input
                    id="is-spec"
                    value={initStaffSpec}
                    onChange={(e) => setInitStaffSpec(e.target.value)}
                    placeholder="e.g. Colour & bridal"
                  />
                </div>
                <div className="field">
                  <label htmlFor="is-email">Work email</label>
                  <input
                    id="is-email"
                    type="email"
                    value={initStaffEmail}
                    onChange={(e) => setInitStaffEmail(e.target.value)}
                    placeholder="stylist@salon.com"
                  />
                </div>
                <div className="field">
                  <label htmlFor="is-mob">Mobile (10-digit India)</label>
                  <input
                    id="is-mob"
                    inputMode="numeric"
                    value={initStaffMobile}
                    onChange={(e) => setInitStaffMobile(e.target.value)}
                    placeholder="Optional roster mobile"
                  />
                </div>
                <div className="field">
                  <label htmlFor="is-gen">Gender (label)</label>
                  <select id="is-gen" value={initStaffGender} onChange={(e) => setInitStaffGender(e.target.value)}>
                    {genderOptions.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="is-par">Parallel bookings max</label>
                  <input
                    id="is-par"
                    type="number"
                    min={1}
                    max={50}
                    value={initStaffParallel}
                    onChange={(e) => setInitStaffParallel(Number(e.target.value) || 1)}
                  />
                  <p className="hint">Overlapping clients this stylist can handle (scheduling hint).</p>
                </div>
                <div className="field field--full">
                  <label htmlFor="is-wh">Weekly availability (JSON)</label>
                  <textarea
                    id="is-wh"
                    rows={5}
                    className="input-textarea"
                    value={initStaffHours}
                    onChange={(e) => setInitStaffHours(e.target.value)}
                  />
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => setInitStaffHours(staffAvailabilityTemplate())}>
                    Reset week template
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="admin-add-tenant__grid admin-add-tenant__grid--wide" style={{ marginTop: "1.25rem" }}>
            <div className="field field--full">
              <h3 className="section-heading" style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>
                Optional starter services (this tenant only)
              </h3>
              <p className="hint">
                Enter up to three bookable offerings (e.g. Haircut, Facial). Leave a row blank to skip. Prices in ₹ (rupees, excl. tax
                fields).
              </p>
              {starterTemplates.length > 0 && (
                <div className="admin-template-chips" style={{ marginTop: "0.5rem" }}>
                  <span className="text-muted small" style={{ marginRight: "0.5rem" }}>
                    Quick-fill from platform templates (not copied from other salons):
                  </span>
                  {starterTemplates.map((t, i) => (
                    <button
                      key={i}
                      type="button"
                      className="btn btn--ghost btn--small"
                      onClick={() => fillNextEmptyStarterRow(t)}
                    >
                      + {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {starterServices.map((row, idx) => (
              <div key={idx} className="field field--full admin-starter-svc-row">
                <input
                  aria-label={`Service ${idx + 1} name`}
                  value={row.name}
                  onChange={(e) => {
                    const next = [...starterServices];
                    next[idx] = { ...next[idx], name: e.target.value };
                    setStarterServices(next);
                  }}
                  placeholder={idx === 0 ? "e.g. Signature haircut" : idx === 1 ? "e.g. Beard trim" : "e.g. Classic facial"}
                />
                <input
                  aria-label={`Service ${idx + 1} category`}
                  value={row.category}
                  onChange={(e) => {
                    const next = [...starterServices];
                    next[idx] = { ...next[idx], category: e.target.value };
                    setStarterServices(next);
                  }}
                  placeholder="Category"
                />
                <input
                  aria-label={`Service ${idx + 1} minutes`}
                  inputMode="numeric"
                  value={row.duration}
                  onChange={(e) => {
                    const next = [...starterServices];
                    next[idx] = { ...next[idx], duration: e.target.value };
                    setStarterServices(next);
                  }}
                  placeholder="min"
                />
                <input
                  aria-label={`Service ${idx + 1} price INR`}
                  inputMode="decimal"
                  value={row.priceInr}
                  onChange={(e) => {
                    const next = [...starterServices];
                    next[idx] = { ...next[idx], priceInr: e.target.value };
                    setStarterServices(next);
                  }}
                  placeholder="₹"
                />
              </div>
            ))}
          </div>

          <button type="submit" className="btn btn--gold" disabled={saving}>
            {saving ? "Saving…" : "Add tenant"}
          </button>
        </form>
      </AdminPanel>

      <div style={{ height: "1rem" }} />

      <AdminPanel title="All tenants" subtitle={`${tenants.length} businesses`}>
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Type</th>
                <th>City</th>
                <th>Specialties</th>
                <th>Salon #</th>
                <th>Owner #</th>
                <th>Status</th>
                <th>Plan</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.businessName}</strong>
                    <div className="text-muted small">{t.slug}</div>
                  </td>
                  <td>{t.businessType}</td>
                  <td>{t.city ?? "—"}</td>
                  <td className="td-clip">{t.specialties ?? "—"}</td>
                  <td>{displayPhone(t.salonPhone)}</td>
                  <td>{displayPhone(t.ownerMobile)}</td>
                  <td>
                    <AdminStatusBadge status={t.tenantSuspended ? "SUSPENDED" : t.subscriptionStatus} />
                  </td>
                  <td className="text-muted small">{t.subscriptionPlan ?? "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--small btn--ghost"
                      disabled={snapshotBusy}
                      onClick={() => void openSnapshot(t)}
                    >
                      Snapshot
                    </button>{" "}
                    <button type="button" className="btn btn--small btn--ghost" onClick={() => void toggleSuspend(t)}>
                      {t.tenantSuspended ? "Activate" : "Suspend"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>

      {snapshot ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="snap-title">
          <div className="surface-card modal-card" style={{ maxWidth: "40rem" }}>
            <h2 id="snap-title" className="section-heading">
              {snapshot.clinic.businessName}
            </h2>
            <p className="text-muted small">
              {snapshot.clinic.businessType} · /{snapshot.clinic.slug} · {snapshot.appointmentsLast30Days} bookings (30d)
            </p>
            <ul className="simple-list text-muted small">
              <li>Geo pin: {snapshot.hasGeoPin ? "yes" : "no"}</li>
              <li>Display location: {snapshot.hasDisplayLocation ? "yes" : "no"}</li>
              <li>Working hours: {snapshot.hasWorkingHours ? "yes" : "no"}</li>
              <li>Active services: {snapshot.hasActiveServices ? "yes" : "no"}</li>
              <li>Salon phone: {snapshot.hasSalonPhone ? "yes" : "no"}</li>
            </ul>
            <h3 className="section-heading">Team ({snapshot.staff.length})</h3>
            <ul className="simple-list">
              {snapshot.staff.map((s) => (
                <li key={s.id}>
                  {s.displayName}
                  {s.specialization ? ` · ${s.specialization}` : ""}
                  {s.email ? ` · ${s.email}` : ""}
                </li>
              ))}
            </ul>
            <h3 className="section-heading">Logins ({snapshot.memberships.length})</h3>
            <ul className="simple-list">
              {snapshot.memberships.map((m, i) => (
                <li key={`${m.userEmail}-${i}`}>
                  {m.userName} · {m.userEmail} · {m.clinicRole}
                </li>
              ))}
            </ul>
            <h3 className="section-heading">Services ({snapshot.services.length})</h3>
            <ul className="simple-list">
              {snapshot.services.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
            <button type="button" className="btn btn--primary" onClick={() => setSnapshot(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
