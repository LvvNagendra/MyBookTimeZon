import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  EXPLORE_CATEGORY_CHIPS,
  EXPLORE_SUB_FILTERS,
  NEARBY_SALONS,
} from "../data/dummy";
import { IconMap, IconMapPin, IconSearch, IconSliders } from "../components/CustomerIcons";
import { PageBackBar } from "../components/PageBackBar";
import {
  filterSalonsByGeo,
  getCitiesFor,
  getCountries,
  getStatesForCountry,
  getVillagesFor,
  type SalonGeoFields,
} from "../utils/geoSearch";
import { USE_MOCK_API, apiDiscoverClinics, type ClinicPublicSummary } from "../api/client";
import { GoogleMapEmbed } from "../components/GoogleMapEmbed";
import { haversineKm } from "../utils/geoDistance";
import { salonDetailPath } from "../utils/salonRoutes";

function moneyPaise(p: number) {
  return (p / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

type NearbyItem = (typeof NEARBY_SALONS)[number] & {
  latitude?: number | null;
  longitude?: number | null;
};

function apiSummaryToGeo(s: ClinicPublicSummary): SalonGeoFields {
  return {
    country: s.country ?? "",
    state: s.state ?? "",
    city: s.city ?? "",
    village: s.village ?? "",
    displayLocation: s.displayLocation ?? "",
    name: s.businessName,
    address: s.address ?? "",
    tags: [],
  };
}

function mapApiToNearby(s: ClinicPublicSummary): NearbyItem {
  const bt = String(s.businessType || "SALON").toUpperCase();
  const exploreIds =
    bt === "CLINIC"
      ? ["all", "clinic", "facial"]
      : ["all", "barber", "hair", "massage", "facial"];
  return {
    id: s.id,
    slug: s.slug,
    name: s.businessName,
    rating: 0,
    reviewsCount: 0,
    distanceKm: 0,
    openNow: true,
    country: s.country ?? "India",
    state: s.state ?? "",
    city: s.city ?? "",
    village: s.village ?? "",
    displayLocation: s.displayLocation ?? s.city ?? "",
    address: s.address ?? "",
    tags: bt === "CLINIC" ? ["Clinic"] : ["Salon"],
    imageTone: "linear-gradient(145deg, #e8e4dc, #d4cfc4)",
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=85&auto=format&fit=crop",
    priceFromPaise: 0,
    exploreIds,
    businessType: s.businessType,
    latitude: s.latitude ?? null,
    longitude: s.longitude ?? null,
  };
}

export default function FindBusinessPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const cat = params.get("cat") || "all";
  const sector = (params.get("sector") || "").toUpperCase();
  const country = params.get("country") || "";
  const state = params.get("state") || "";
  const city = params.get("city") || "";
  const village = params.get("village") || "";
  const q = params.get("q") || "";

  const [apiCatalog, setApiCatalog] = useState<ClinicPublicSummary[]>([]);
  const [apiFiltered, setApiFiltered] = useState<NearbyItem[]>([]);
  const [myPos, setMyPos] = useState<{ lat: number; lon: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);

  useEffect(() => {
    if (USE_MOCK_API) return;
    let alive = true;
    void apiDiscoverClinics({})
      .then((rows) => {
        if (alive) setApiCatalog(rows);
      })
      .catch(() => {
        if (alive) setApiCatalog([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (USE_MOCK_API) return;
    let alive = true;
    void apiDiscoverClinics({ country, state, city, village, q })
      .then((rows) => {
        if (alive) setApiFiltered(rows.map(mapApiToNearby));
      })
      .catch(() => {
        if (alive) setApiFiltered([]);
      });
    return () => {
      alive = false;
    };
  }, [country, state, city, village, q]);

  const optionSourceGeo = useMemo(() => {
    if (USE_MOCK_API) return NEARBY_SALONS;
    return apiCatalog.map(apiSummaryToGeo);
  }, [apiCatalog]);

  const countryOptions = useMemo(() => getCountries(optionSourceGeo), [optionSourceGeo]);
  const stateOptions = useMemo(() => getStatesForCountry(optionSourceGeo, country), [optionSourceGeo, country]);
  const cityOptions = useMemo(() => getCitiesFor(optionSourceGeo, country, state), [optionSourceGeo, country, state]);
  const villageOptions = useMemo(
    () => getVillagesFor(optionSourceGeo, country, state, city),
    [optionSourceGeo, country, state, city],
  );

  const geoFiltered = useMemo(() => {
    if (!USE_MOCK_API) {
      return apiFiltered;
    }
    return filterSalonsByGeo(NEARBY_SALONS, {
      country,
      state,
      city,
      village,
      q,
    }) as NearbyItem[];
  }, [USE_MOCK_API, apiFiltered, country, state, city, village, q]);

  const radiusFiltered = useMemo(() => {
    if (!myPos) return geoFiltered;
    return geoFiltered
      .map((s) => {
        if (s.latitude == null || s.longitude == null) return s;
        const d = haversineKm(myPos.lat, myPos.lon, s.latitude, s.longitude);
        return { ...s, distanceKm: Math.round(d * 10) / 10 };
      })
      .filter((s) => {
        if (s.latitude == null || s.longitude == null) return true;
        return s.distanceKm <= radiusKm;
      });
  }, [geoFiltered, myPos, radiusKm]);

  const filtered = useMemo(() => {
    let rows = radiusFiltered;
    if (cat !== "all") {
      rows = rows.filter((s) => (s.exploreIds?.length ? s.exploreIds.includes(cat) : true));
    }
    if (sector === "SALON" || sector === "CLINIC") {
      rows = rows.filter((s) => String(s.businessType || "").toUpperCase() === sector);
    }
    return rows;
  }, [radiusFiltered, cat, sector]);

  const locateMe = useCallback(() => {
    setGeoMsg(null);
    if (!navigator.geolocation) {
      setGeoMsg("Geolocation is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyPos({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoMsg("Filtering by distance when salons have coordinates saved.");
      },
      () => setGeoMsg("Location permission denied — you can still search by place."),
      { enableHighAccuracy: false, timeout: 12_000 },
    );
  }, []);

  const offerSalons = USE_MOCK_API ? NEARBY_SALONS : apiFiltered.length > 0 ? apiFiltered : apiCatalog.map(mapApiToNearby);

  function setCat(id: string) {
    setParams((prev) => {
      const n = new URLSearchParams(prev);
      if (id === "all") n.delete("cat");
      else n.set("cat", id);
      return n;
    });
  }

  function setSector(id: string) {
    setParams((prev) => {
      const n = new URLSearchParams(prev);
      if (!id || id === "all") n.delete("sector");
      else n.set("sector", id);
      return n;
    });
  }

  function patchParams(updater: (n: URLSearchParams) => void) {
    setParams((prev) => {
      const n = new URLSearchParams(prev);
      updater(n);
      return n;
    });
  }

  function setCountry(value: string) {
    patchParams((n) => {
      if (value) n.set("country", value);
      else n.delete("country");
      n.delete("state");
      n.delete("city");
      n.delete("village");
    });
  }

  function setState(value: string) {
    patchParams((n) => {
      if (value) n.set("state", value);
      else n.delete("state");
      n.delete("city");
      n.delete("village");
    });
  }

  function setCity(value: string) {
    patchParams((n) => {
      if (value) n.set("city", value);
      else n.delete("city");
      n.delete("village");
    });
  }

  function setVillage(value: string) {
    patchParams((n) => {
      if (value) n.set("village", value);
      else n.delete("village");
    });
  }

  function setQ(value: string) {
    patchParams((n) => {
      if (value.trim()) n.set("q", value.trim());
      else n.delete("q");
    });
  }

  function clearGeo() {
    setMyPos(null);
    setGeoMsg(null);
    patchParams((n) => {
      n.delete("country");
      n.delete("state");
      n.delete("city");
      n.delete("village");
      n.delete("q");
    });
  }

  function go(e: FormEvent) {
    e.preventDefault();
    navigate("/book/SALON/urban-trim");
  }

  return (
    <main id="main" className="section page-pad nearby-page customer-surface">
      <div className="page-wide explore-layout">
        <PageBackBar to="/home" label="Home" />

        <div className="mkt-sector__grid explore-sector-tabs" role="tablist" aria-label="Sector filter" style={{ marginBottom: "1rem" }}>
          <button
            type="button"
            role="tab"
            aria-selected={!sector}
            className={`mkt-sector__card${!sector ? " mkt-sector__card--active" : ""}`}
            onClick={() => setSector("all")}
          >
            <span className="mkt-sector__label">All</span>
            <span className="mkt-sector__short">Salons &amp; clinics</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sector === "SALON"}
            className={`mkt-sector__card${sector === "SALON" ? " mkt-sector__card--active" : ""}`}
            onClick={() => setSector("SALON")}
          >
            <span className="mkt-sector__label">Salon &amp; beauty</span>
            <span className="mkt-sector__short">Hair · Spa · Grooming</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sector === "CLINIC"}
            className={`mkt-sector__card${sector === "CLINIC" ? " mkt-sector__card--active" : ""}`}
            onClick={() => setSector("CLINIC")}
          >
            <span className="mkt-sector__label">Doctor &amp; clinic</span>
            <span className="mkt-sector__short">Dermatology · GP</span>
          </button>
        </div>

        <div className="search-pill customer-search-pill explore-search">
          <span className="search-pill__icon" aria-hidden>
            <IconSearch width={20} height={20} />
          </span>
          <input
            type="search"
            placeholder="Search name, area, address…"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Keyword search"
          />
          <button type="button" className="search-pill__filter" aria-label="Filters (demo)">
            <IconSliders width={20} height={20} />
          </button>
          <button type="button" className="search-pill__filter" aria-label="Location (demo)">
            <IconMapPin width={20} height={20} />
          </button>
        </div>

        <section className="surface-card geo-filters" aria-label="Location filters">
          <h2 className="section-heading geo-filters__title">Search by place</h2>
          <p className="text-muted small geo-filters__hint">
            Pick country, state, city, and area — or use the box above for any keyword. Share this URL to keep filters.
          </p>
          <div className="geo-filters__grid">
            <label className="geo-filters__field">
              <span className="geo-filters__label">Country</span>
              <select
                className="geo-filters__select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                aria-label="Country"
              >
                <option value="">Any country</option>
                {countryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="geo-filters__field">
              <span className="geo-filters__label">State / region</span>
              <select
                className="geo-filters__select"
                value={state}
                onChange={(e) => setState(e.target.value)}
                aria-label="State or region"
              >
                <option value="">Any state</option>
                {stateOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="geo-filters__field">
              <span className="geo-filters__label">City / town</span>
              <select
                className="geo-filters__select"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="City or town"
              >
                <option value="">Any city</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="geo-filters__field">
              <span className="geo-filters__label">Area / village</span>
              <select
                className="geo-filters__select"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                aria-label="Area or village"
              >
                <option value="">Any area</option>
                {villageOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="geo-filters__actions">
            <button type="button" className="btn btn--ghost btn--small" onClick={clearGeo}>
              Clear location &amp; keyword
            </button>
          </div>
          {!USE_MOCK_API && (
            <div className="geo-nearme surface-card" style={{ marginTop: "1rem", padding: "1rem" }}>
              <h3 className="section-heading" style={{ fontSize: "1rem", marginTop: 0 }}>
                Near me
              </h3>
              <p className="text-muted small">
                Uses your device location and each salon&apos;s saved latitude/longitude. Salons without pins stay visible.
              </p>
              <div className="field field--inline" style={{ alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <button type="button" className="btn btn--customer btn--small" onClick={() => locateMe()}>
                  Use my location
                </button>
                <label className="text-muted small" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  Radius
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    disabled={!myPos}
                  />
                  {radiusKm} km
                </label>
                {myPos && (
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => setMyPos(null)}>
                    Clear GPS filter
                  </button>
                )}
              </div>
              {geoMsg && <p className="text-muted small">{geoMsg}</p>}
            </div>
          )}
        </section>

        <div className="category-scroll category-scroll--horizontal explore-chips">
          {EXPLORE_CATEGORY_CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`customer-chip${cat === c.id ? " customer-chip--active" : ""}`}
              onClick={() => setCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <h1 className="page-title explore-title">Explore</h1>
        <p className="page-subtitle">Find salons and clinics near you — live results from SlotNexa.</p>

        <section aria-label="Special offers">
          <div className="section-row">
            <h2 className="section-heading">Special offers</h2>
            <span className="text-muted small">Swipe</span>
          </div>
          <div className="salon-scroll explore-offers">
            {offerSalons.map((s) => (
              <Link key={s.id} to={salonDetailPath(s.slug, s.businessType)} className="surface-card explore-offer-card">
                <div
                  className="explore-offer-card__img"
                  style={{ backgroundImage: `url(${s.imageUrl})` }}
                />
                <div className="explore-offer-card__body">
                  <h3>{s.name}</h3>
                  <p className="text-muted small">{s.address}</p>
                  <p className="explore-offer-card__meta">
                    ★ {s.rating} ({s.reviewsCount} reviews) · {moneyPaise(s.priceFromPaise)}+
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div id="explore-map" className="surface-card explore-map-wrap" role="region" aria-label="Map">
          <GoogleMapEmbed
            addressQuery={[village, city, state, country].filter(Boolean).join(", ") || "India"}
            caption="Area preview from your filters — open a salon for its exact pin when the business saved coordinates."
            height="280px"
          />
        </div>

        <div className="section-row">
          <h2 className="section-heading">Results ({filtered.length})</h2>
          <button type="button" className="link-customer">
            See all
          </button>
        </div>

        <div className="subfilter-row">
          {EXPLORE_SUB_FILTERS.map((label) => (
            <span key={label} className="subfilter-chip">
              {label}
            </span>
          ))}
        </div>

        <ul className="nearby-list">
          {filtered.map((s) => (
            <li key={s.id}>
              <Link to={salonDetailPath(s.slug, s.businessType)} className="surface-card nearby-card nearby-card--photo">
                <div
                  className="nearby-card__visual nearby-card__visual--cover"
                  style={{ backgroundImage: `url(${s.imageUrl})` }}
                />
                <div>
                  <h2 className="nearby-card__title">{s.name}</h2>
                  <p className="text-muted small">
                    ★ {s.rating} ({s.reviewsCount}) · {s.distanceKm} km · {s.displayLocation} ·{" "}
                    {s.openNow ? "Open" : "Closed"}
                  </p>
                  <p className="salon-tags">
                    {s.tags.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Link to="#explore-map" className="fab-map" aria-label="Jump to map">
          <IconMap width={22} height={22} />
          Map
        </Link>

        <form onSubmit={go} className="surface-card book-quick">
          <p className="text-muted small">Quick open booking flow (mock)</p>
          <button type="submit" className="btn btn--customer btn--wide">
            Book Urban Trim
          </button>
        </form>
      </div>
    </main>
  );
}
